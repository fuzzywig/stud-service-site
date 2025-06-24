// src/entry-server.jsx
import React from 'react'
import { renderToString } from 'react-dom/server'
import pkg from 'react-helmet-async'
const { HelmetProvider, Helmet } = pkg

// Simple component that sets dynamic meta tags based on URL
function ServerSEO({ url }) {
    // Check if this is an advert details page
    const advertMatch = url.match(/\/advert-details\/([^\/\?]+)/)
    const profileMatch = url.match(/\/profile\/([^\/\?]+)/)
    const blogMatch = url.match(/\/blog\/([^\/\?]+)/)

    if (advertMatch) {
        const advertId = advertMatch[1]
        return (
            <Helmet>
                <title>Pet Advert Details | My Pet Connect</title>
                <meta name="description" content="View detailed information about this pet listing including breed, price, location and breeder details on My Pet Connect." />
                <meta property="og:title" content="Pet Advert Details | My Pet Connect" />
                <meta property="og:description" content="View detailed information about this pet listing including breed, price, location and breeder details on My Pet Connect." />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Pet Advert Details | My Pet Connect" />
                <meta name="twitter:description" content="View detailed information about this pet listing including breed, price, location and breeder details on My Pet Connect." />
            </Helmet>
        )
    }

    if (profileMatch) {
        return (
            <Helmet>
                <title>Breeder Profile | My Pet Connect</title>
                <meta name="description" content="View breeder profile, reviews and available pets on My Pet Connect." />
            </Helmet>
        )
    }

    if (blogMatch) {
        return (
            <Helmet>
                <title>Blog Post | My Pet Connect</title>
                <meta name="description" content="Read our latest blog post about pets, breeding and animal care on My Pet Connect." />
            </Helmet>
        )
    }

    // Default meta tags for other pages
    return (
        <Helmet>
            <title>My Pet Connect - Find Puppies & Kittens for Sale UK</title>
            <meta name="description" content="Find puppies, kittens and pets for sale from trusted UK breeders. Browse thousands of dogs, cats and rabbits. Safe, verified listings with health guarantees." />
            <meta property="og:title" content="My Pet Connect - Find Puppies & Kittens for Sale UK" />
            <meta property="og:description" content="Find puppies, kittens and pets for sale from trusted UK breeders. Browse thousands of dogs, cats and rabbits. Safe, verified listings with health guarantees." />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
    )
}

export function render(url, context = {}) {
    const helmetContext = {}

    try {
        // Render a minimal component that just sets the meta tags
        const html = renderToString(
            <HelmetProvider context={helmetContext}>
                <ServerSEO url={url} />
                <div suppressHydrationWarning={true}>
                    {/* Empty div that React will replace during hydration */}
                </div>
            </HelmetProvider>
        )

        // Extract helmet data
        const { helmet } = helmetContext

        return {
            html: '', // Empty HTML - let React handle all the content
            helmet: {
                title: helmet?.title?.toString() || '',
                meta: helmet?.meta?.toString() || '',
                link: helmet?.link?.toString() || '',
                htmlAttributes: helmet?.htmlAttributes?.toString() || '',
            }
        }
    } catch (error) {
        console.error('SSR Render Error:', error)
        return {
            html: '', // Empty HTML fallback
            helmet: {
                title: '<title>My Pet Connect</title>',
                meta: '<meta name="description" content="Find pets for sale from trusted UK breeders" />',
                link: '',
                htmlAttributes: '',
            }
        }
    }
}