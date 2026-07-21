import { type SchemaTypeDefinition } from 'sanity'
import page from './page'
import countryPage from './countryPage'
import { legalPage } from './legalPage'
import { pricingPage } from './pricingPage'
import { contactPage } from './contactPage'
import { faqPage } from './faqPage'
import home from './home'
import blogPost from './blogPost'
import caseStudy from './caseStudy'
import navigation from './navigation'
import snippet from './snippet'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Main Content
    page,
    home,
    blogPost,
    caseStudy,
    
    // Specialized Pages
    countryPage,
    legalPage,
    pricingPage,
    contactPage,
    faqPage,
    
    // Site Configuration
    navigation,
    snippet,
  ],
}
