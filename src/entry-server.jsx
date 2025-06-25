// src/entry-server.jsx
import React from 'react'
import { renderToString } from 'react-dom/server'
import pkg from 'react-helmet-async'
const { HelmetProvider, Helmet } = pkg

// Function to generate dynamic blog post meta tags
function generateBlogPostSEO(post) {
    if (!post) {
        return {
            title: 'Blog Post Not Found | My Pet Connect',
            description: 'The blog post you\'re looking for doesn\'t exist or has been removed. Browse our latest pet care tips and breeding insights.'
        }
    }

    // Create dynamic title
    const title = `${post.title} | My Pet Connect Blog`

    // Create dynamic description
    let description = ''

    if (post.excerpt) {
        description = post.excerpt
    } else if (post.content) {
        // Extract plain text from content and truncate
        const plainText = post.content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
            .replace(/## (.*?)(?=\n|$)/g, '$1') // Remove markdown headers
            .replace(/### (.*?)(?=\n|$)/g, '$1')
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim()

        description = plainText.length > 155
            ? plainText.substring(0, 152) + '...'
            : plainText
    }

    // Fallback description
    if (!description.trim()) {
        description = `Read "${post.title}" on My Pet Connect blog. Discover insights, tips, and stories about pet breeding, care, and connecting with fellow pet enthusiasts.`
    }

    // Ensure description doesn't exceed 160 characters
    if (description.length > 160) {
        description = description.substring(0, 157) + '...'
    }

    return { title, description }
}

// Server-side SEO component
function ServerSEO({ url, blogPost = null }) {
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
        const { title, description } = generateBlogPostSEO(blogPost)

        return (
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="article" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                {blogPost?.image && (
                    <>
                        <meta property="og:image" content={blogPost.image} />
                        <meta name="twitter:image" content={blogPost.image} />
                    </>
                )}
                {blogPost?.createdAt && (
                    <meta property="article:published_time" content={blogPost.createdAt.toISOString()} />
                )}
                {blogPost?.categories && blogPost.categories.length > 0 && (
                    <meta property="article:section" content={blogPost.categories[0]} />
                )}
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

// Main render function - now receives data from server.js
export async function render(url, context = {}) {
    const helmetContext = {}
    const { blogPost } = context

    try {
        console.log(`🎭 Entry-server: Rendering ${url} with blogPost:`, blogPost ? blogPost.title : 'none')

        // Render the SEO component with data passed from server.js
        const html = renderToString(
            <HelmetProvider context={helmetContext}>
                <ServerSEO url={url} blogPost={blogPost} />
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
        console.error('❌ Entry-server Render Error:', error)
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