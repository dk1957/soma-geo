import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const currentUser = await getCurrentUser();
    if (!currentUser?.clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with service role
    const supabase = createServiceClient();
    
    // Parse request data
    const body = await request.json();
    
    // Extract critical fields only
    const {
      externalRunId,
      accountId,
      brandId,
      brandData,
      progress,
    } = body;

    // Use the authenticated user's ID instead of accepting it from the request body
    const userId = currentUser.clerkUserId;
    
    // Validation - basic checks only
    if (!externalRunId || !progress || !brandData?.brandName) {
      console.error('Missing required fields:', { externalRunId, brandData, progress });
      return NextResponse.json({
        error: 'Missing required fields',
        details: {
          externalRunId: !externalRunId ? 'required' : undefined,
          brandData: !brandData?.brandName ? 'brandName required' : undefined
        }
      }, { status: 400 });
    }
    
    // Find or create the brand record first
    let finalBrandId = brandId;
    let brandContextId: string | null = null;
    
    try {
      if (!finalBrandId && accountId) {
        // Try to find existing brand by name and account
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('account_id', accountId)
          .eq('name', brandData.brandName)
          .maybeSingle();
          
        if (existingBrand?.id) {
          finalBrandId = existingBrand.id;
        } else if (accountId) {
          // Create a new brand record with provided information
          const { data: newBrand, error: brandError } = await supabase
            .from('brands')
            .insert({
              account_id: accountId,
              name: brandData.brandName,
              slug: brandData.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
              brand_website: brandData.brandWebsite,
              brand_category: brandData.brandCategory,
              target_markets: brandData.targetMarkets || [],
              products_services: brandData.productsServices,
              description: `Brand created from onboarding run for ${brandData.brandName}`
            })
            .select('id')
            .single();
            
          if (brandError) {
            console.error('❌ Error creating brand:', brandError);
            throw new Error(`Failed to create brand: ${brandError.message}`);
          }
          
          finalBrandId = newBrand.id;
        }
      }
      
      // Create or get existing brand context
      if (finalBrandId) {
        const { data: existingContext } = await supabase
          .from('brand_contexts')
          .select('id')
          .eq('clerk_id', userId)
          .eq('brand_id', finalBrandId)
          .maybeSingle();
          
        if (existingContext?.id) {
          brandContextId = existingContext.id;
        } else {
          // Create brand context linked to the brand record
          const { data: newContext, error: insertError } = await supabase
            .from('brand_contexts')
            .insert({
              clerk_id: userId,
              account_id: accountId || null,
              brand_id: finalBrandId,
              brand_name: brandData.brandName,
              brand_data: {
                brandWebsite: brandData.brandWebsite,
                brandCategory: brandData.brandCategory,
                targetMarkets: brandData.targetMarkets,
                productsServices: brandData.productsServices
              }
            })
            .select('id')
            .single();
          
          if (insertError) {
            console.error('❌ Error creating brand context:', insertError);
            throw new Error(`Failed to create brand context: ${insertError.message}`);
          }
          
          brandContextId = newContext.id;
        }
      }
    } catch (error) {
      console.error('❌ Error with brand setup:', error);
      return NextResponse.json({ 
        error: `Brand setup error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      }, { status: 500 });
    }    // Ensure user has a profile and get the profile ID
    let profileId;
    try {
      // First, try to find existing profile by clerk_id
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', userId)
        .single();
      
      if (existingProfile) {
        profileId = existingProfile.id;
      } else {
        // If no profile exists, create one with clerk_id
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            clerk_id: userId,
            email: currentUser.email || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
          
        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }
        profileId = newProfile.id;
      }
    } catch (profileSetupError) {
      console.error('❌ Profile setup failed:', profileSetupError);
      return NextResponse.json({ 
        error: `Profile setup error: ${profileSetupError instanceof Error ? profileSetupError.message : 'Unknown error'}`,
        success: false
      }, { status: 500 });
    }
    
    // Create run record using upsert to handle duplicates
    try {
      const { data: run, error } = await supabase
        .from('runs')
        .upsert({
          id: externalRunId, // Use external ID as primary key
          profile_id: profileId, // Use the actual profile ID, not user ID
          account_id: accountId || null,
          brand_id: finalBrandId || null,
          status: progress.is_complete ? 'completed' : 'running',
          total_jobs: progress.total_jobs || 0,
          completed_jobs: progress.completed_jobs || 0,
          failed_jobs: progress.failed_jobs || 0,
          prompt_count: 0, // Will be updated when responses are stored
          model_count: 0,  // Will be updated when responses are stored
          brand_context: {
            brand_name: brandData.brandName,
            brand_website: brandData.brandWebsite,
            brand_category: brandData.brandCategory,
            target_markets: brandData.targetMarkets,
            products_services: brandData.productsServices,
            brand_context_id: brandContextId
          }
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('❌ Error upserting run:', error);
        // If it's still a unique constraint error, try a manual update
        if (error.code === '23505') {
          // Try a manual update for existing run
          const { data: updatedRun, error: updateError } = await supabase
            .from('runs')
            .update({
              status: progress.is_complete ? 'completed' : 'running',
              total_jobs: progress.total_jobs || 0,
              completed_jobs: progress.completed_jobs || 0,
              failed_jobs: progress.failed_jobs || 0,
              brand_context: {
                brand_name: brandData.brandName,
                brand_website: brandData.brandWebsite,
                brand_category: brandData.brandCategory,
                target_markets: brandData.targetMarkets,
                products_services: brandData.productsServices,
                brand_context_id: brandContextId
              }
            })
            .eq('id', externalRunId)
            .select('id')
            .single();
            
          if (updateError) {
            throw new Error(`Failed to update existing run: ${updateError.message}`);
          }
          
          return NextResponse.json({
            success: true,
            run_id: updatedRun.id,
            brand_id: finalBrandId,
            brand_context_id: brandContextId,
            action: 'updated'
          });
        } else {
          throw new Error(`Failed to create run: ${error.message}`);
        }
      }
        
      return NextResponse.json({
        success: true,
        run_id: run.id,
        brand_id: finalBrandId,
        brand_context_id: brandContextId,
        action: 'upserted'
      });
      
    } catch (error) {
      console.error('❌ Error creating run:', error);
      return NextResponse.json({ 
        error: `Run creation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
        brand_id: finalBrandId,
        brand_context_id: brandContextId // Return these so frontend knows we at least got this far
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Server error in simplified run storage API:', error);
    return NextResponse.json({
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }, { status: 500 });
  }
}