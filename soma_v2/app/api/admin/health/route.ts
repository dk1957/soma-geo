import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Redis } from '@upstash/redis'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  checks: {
    database: HealthCheckResult
    redis: HealthCheckResult
    externalApis: HealthCheckResult
    cronJobs: HealthCheckResult
  }
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  responseTime?: number
  error?: string
  details?: any
}

const startTime = Date.now()

export async function GET(request: NextRequest) {
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'healthy' },
      redis: { status: 'healthy' },
      externalApis: { status: 'healthy' },
      cronJobs: { status: 'healthy' }
    },
    uptime: Date.now() - startTime,
    memory: {
      used: 0,
      total: 0,
      percentage: 0
    }
  }

  try {
    // Get memory usage
    const memUsage = process.memoryUsage()
    healthCheck.memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    }

    // Run all checks in parallel with a global 8-second timeout
    const withTimeout = <T>(promise: Promise<T>, label: string, ms = 8000): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`${label} check timed out after ${ms}ms`)), ms)
        ),
      ])

    const [dbResult, redisResult, apisResult, cronResult] = await Promise.allSettled([
      withTimeout(checkDatabase(), 'database'),
      withTimeout(checkRedis(), 'redis'),
      withTimeout(checkExternalAPIs(), 'externalApis'),
      withTimeout(checkCronJobs(), 'cronJobs'),
    ])

    healthCheck.checks.database = dbResult.status === 'fulfilled'
      ? dbResult.value
      : { status: 'unhealthy', error: dbResult.reason?.message || 'Check failed' }
    healthCheck.checks.redis = redisResult.status === 'fulfilled'
      ? redisResult.value
      : { status: 'unhealthy', error: redisResult.reason?.message || 'Check failed' }
    healthCheck.checks.externalApis = apisResult.status === 'fulfilled'
      ? apisResult.value
      : { status: 'unhealthy', error: apisResult.reason?.message || 'Check failed' }
    healthCheck.checks.cronJobs = cronResult.status === 'fulfilled'
      ? cronResult.value
      : { status: 'unhealthy', error: cronResult.reason?.message || 'Check failed' }

    // Determine overall health
    const unhealthyChecks = Object.values(healthCheck.checks).filter(check => check.status === 'unhealthy')
    
    if (unhealthyChecks.length === 0) {
      healthCheck.status = 'healthy'
    } else if (unhealthyChecks.length <= 1) {
      healthCheck.status = 'degraded'
    } else {
      healthCheck.status = 'unhealthy'
    }

    // Log health check if not healthy
    if (healthCheck.status !== 'healthy') {
      await logHealthStatus(healthCheck)
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: statusCode })

  } catch (error) {
    console.error('Health check failed:', error)
    
    healthCheck.status = 'unhealthy'
    healthCheck.checks = {
      database: { status: 'unhealthy', error: 'Health check system error' },
      redis: { status: 'unhealthy', error: 'Health check system error' },
      externalApis: { status: 'unhealthy', error: 'Health check system error' },
      cronJobs: { status: 'unhealthy', error: 'Health check system error' }
    }

    return NextResponse.json(healthCheck, { status: 503 })
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    const startTime = Date.now()
    const supabase = createServiceClient()
    
    // Simple query to test connectivity
    const { data, error } = await supabase
      .from('brands')
      .select('id')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return {
      status: 'healthy',
      responseTime,
      details: {
        connected: true,
        queryTime: responseTime
      }
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function checkRedis(): Promise<HealthCheckResult> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        status: 'unhealthy',
        error: 'Redis credentials not configured'
      }
    }

    const startTime = Date.now()
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })

    // Test Redis with a simple ping-like operation
    const testKey = `health_check:${Date.now()}`
    await redis.set(testKey, 'ping', { ex: 60 })
    const result = await redis.get(testKey)
    await redis.del(testKey)

    const responseTime = Date.now() - startTime

    if (result !== 'ping') {
      return {
        status: 'unhealthy',
        responseTime,
        error: 'Redis test failed'
      }
    }

    return {
      status: 'healthy',
      responseTime,
      details: {
        connected: true,
        testPassed: true
      }
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function checkExternalAPIs(): Promise<HealthCheckResult> {
  try {
    const checks = []

    // Check OpenRouter (if configured)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const startTime = Date.now()
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        checks.push({
          service: 'openrouter',
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          statusCode: response.status
        })
      } catch (error) {
        checks.push({
          service: 'openrouter',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // Check Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        const startTime = Date.now()
        const response = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          signal: AbortSignal.timeout(5000)
        })
        
        checks.push({
          service: 'resend',
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          statusCode: response.status
        })
      } catch (error) {
        checks.push({
          service: 'resend',
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    const unhealthyServices = checks.filter(check => check.status === 'unhealthy')
    
    return {
      status: unhealthyServices.length === 0 ? 'healthy' : 'unhealthy',
      details: {
        services: checks,
        totalChecked: checks.length,
        healthy: checks.length - unhealthyServices.length,
        unhealthy: unhealthyServices.length
      }
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function checkCronJobs(): Promise<HealthCheckResult> {
  try {
    const supabase = createServiceClient()
    
    // Check recent cron job executions
    const { data: recentLogs, error } = await supabase
      .from('system_logs')
      .select('component, level, created_at')
      .eq('log_type', 'cron_job')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return {
        status: 'unhealthy',
        error: `Failed to check cron job logs: ${error.message}`
      }
    }

    const cronComponents = ['ai_monitoring', 'content_optimization']
    const cronStatus = cronComponents.map(component => {
      const componentLogs = recentLogs?.filter(log => log.component === component) || []
      const hasRecentExecution = componentLogs.length > 0
      const hasErrors = componentLogs.some(log => log.level === 'error')
      
      return {
        component,
        hasRecentExecution,
        hasErrors,
        lastExecution: componentLogs[0]?.created_at || null,
        status: hasRecentExecution && !hasErrors ? 'healthy' : 'unhealthy'
      }
    })

    const unhealthyCrons = cronStatus.filter(cron => cron.status === 'unhealthy')

    return {
      status: unhealthyCrons.length === 0 ? 'healthy' : 'unhealthy',
      details: {
        components: cronStatus,
        totalComponents: cronComponents.length,
        healthy: cronComponents.length - unhealthyCrons.length,
        unhealthy: unhealthyCrons.length
      }
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function logHealthStatus(healthCheck: HealthCheck): Promise<void> {
  try {
    const supabase = createServiceClient()
    
    await supabase
      .from('system_logs')
      .insert({
        log_type: 'health_check',
        component: 'health_monitor',
        level: healthCheck.status === 'degraded' ? 'warning' : 'error',
        message: `System health check: ${healthCheck.status}`,
        data: {
          status: healthCheck.status,
          checks: healthCheck.checks,
          memory: healthCheck.memory,
          uptime: healthCheck.uptime
        }
      })
  } catch (error) {
    console.error('Failed to log health status:', error)
  }
}

// Liveness probe endpoint
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}