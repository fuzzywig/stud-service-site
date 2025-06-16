import React, { useEffect } from "react";
import Hero from "../components/Hero";
import Recommended from "../components/Recommended"; // ✅ Import this
import CTASection from "../components/CTASection";
import PopularBreeds from "../components/PopularBreeds.jsx";

import RecentAdverts from "../components/RecentAdverts";
import RecentBlogPosts from '../components/RecentBlogPosts'; // ✅ Fixed path
import NewsletterSignup from '../components/NewsletterSignup';
import SEO from '../components/SEO';

function Home() {
        return (
            <>
                    <SEO
                        title="Home – Find Local Stud Dogs & Pets for Sale"
                        description="Connect with local pet owners to find stud dogs, puppies, cats, kittens, and rabbits in your area."
                    />

                    <Hero />

                    {/* Dogs */}
                    <RecentAdverts category="dogs" intent="sale" title="Recent Adverts In Puppies For Sale" limitCount={8} />
                    <RecentAdverts category="dogs" intent="stud" title="Recent Adverts In Dogs For Stud" limitCount={8} />
                    <RecentAdverts category="dogs" intent="rescue" title="Dogs Available for Adoption" limitCount={8} />

                    {/* Cats */}
                    <RecentAdverts category="cats" intent="stud" title="Recent Adverts In Cats For Stud" limitCount={8} />
                    <RecentAdverts category="cats" intent="sale" title="Recent Adverts In Kittens For Sale" limitCount={8} />
                    <RecentAdverts category="cats" intent="rescue" title="Cats Available for Adoption" limitCount={8} />

                    {/* Rabbits */}
                    <RecentAdverts category="rabbits" intent="sale" title="Recent Adverts In Rabbits For Sale" limitCount={8} />
                    <RecentAdverts category="rabbits" intent="rescue" title="Rabbits Available for Adoption" limitCount={8} />

                    {/* All Rescues Section - Optional: Show all rescue animals in one section */}
                    <RecentAdverts intent="rescue" title="All Animals Available for Adoption" limitCount={12} />

                    {/* Add the blog section above CTA */}
                <PopularBreeds />

                <RecentBlogPosts />
                <NewsletterSignup />
                    <CTASection />

            </>
        );
}

export default Home;