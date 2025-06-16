// utils/blogUtils.js
// Create this new utility file

/**
 * Converts a blog post title to a SEO-friendly URL slug
 */
export const createSlug = (title) => {
    if (!title) return '';

    return title
        .toLowerCase()
        .trim()
        // Remove special characters except hyphens and spaces
        .replace(/[^\w\s-]/g, '')
        // Replace spaces and multiple hyphens with single hyphens
        .replace(/[\s_-]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '')
        // Limit length to 60 characters for SEO
        .substring(0, 60)
        .replace(/-+$/, ''); // Remove trailing hyphen if cut off
};

/**
 * Validates if a slug is properly formatted
 */
export const isValidSlug = (slug) => {
    if (!slug || typeof slug !== 'string') return false;

    // Check if slug matches SEO-friendly pattern
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugPattern.test(slug) && slug.length <= 60;
};

/**
 * Ensures slug is unique by appending number if needed
 */
export const ensureUniqueSlug = async (baseSlug, existingPosts = []) => {
    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists
    while (existingPosts.some(post => post.slug === slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};

/**
 * Creates a complete blog post URL
 */
export const createBlogUrl = (slug, baseUrl = '') => {
    if (!slug) return `${baseUrl}/blog`;
    return `${baseUrl}/blog/${slug}`;
};

/**
 * Extracts slug from a blog URL
 */
export const extractSlugFromUrl = (url) => {
    if (!url) return '';

    const match = url.match(/\/blog\/([^\/\?#]+)/);
    return match ? match[1] : '';
};

// Example usage:
// const slug = createSlug("The Honest Guide to Finding a Responsible Breeder");
// Result: "honest-guide-finding-responsible-breeder"