import React, { useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import Hero from "../components/Hero";
import Recommended from "../components/Recommended";
import CTASection from "../components/CTASection";
import PopularBreeds from "../components/PopularBreeds.jsx";
import RecentAdverts from "../components/RecentAdverts";
import RecentBlogPosts from '../components/RecentBlogPosts';
import NewsletterSignup from '../components/NewsletterSignup';
import SEO from '../components/SEO';

function Home() {
        return (
            <>
                    <SEO
                        title="Find Puppies & Kittens for Sale UK | My Pet Connect"
                        description="Find puppies, kittens and pets for sale from trusted UK breeders. Browse thousands of dogs, cats and rabbits. Safe, verified listings with health guarantees."
                    />

                    <Hero />

                    {/* Dogs */}
                    <RecentAdverts category="dogs" intent="sale" title="Recent Puppies For Sale" limitCount={8} />
                    <RecentAdverts category="dogs" intent="stud" title="Stud Dogs for Breeding" limitCount={8} />
                    <RecentAdverts category="dogs" intent="rescue" title="Dog Rescue & Adoption" limitCount={8} />

                    {/* Cats */}
                    <RecentAdverts category="cats" intent="stud" title="Stud Cats for Breeding" limitCount={8} />
                    <RecentAdverts category="cats" intent="sale" title="Recent Kittens For Sale" limitCount={8} />
                    <RecentAdverts category="cats" intent="rescue" title="Cat Rescue & Adoption" limitCount={8} />

                    {/* Rabbits */}
                    <RecentAdverts category="rabbits" intent="sale" title="Recent Rabbits For Sale" limitCount={8} />
                    <RecentAdverts category="rabbits" intent="rescue" title="Rabbit Rescue & Adoption" limitCount={8} />

                    {/* All Rescues Section */}
                    <RecentAdverts intent="rescue" title="All Rescue Animals" limitCount={12} />

                    <PopularBreeds />
                    <RecentBlogPosts />
                    <NewsletterSignup />
                    <CTASection />
            </>
        );
}

export default Home;