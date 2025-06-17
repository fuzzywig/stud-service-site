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
                title="Post a Pet Listing | Puppies, Kittens & Stud Dogs UK"
                description="Create your free pet listing today. List puppies, kittens or stud dogs for sale. Connect with trusted UK pet lovers. Easy, secure, and breeder-friendly."
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

            {/* All Rescues Section */}
            <RecentAdverts intent="rescue" title="All Animals Available for Adoption" limitCount={12} />

            <PopularBreeds />
            <RecentBlogPosts />
            <NewsletterSignup />
            <CTASection />
        </>
    );
}

export default Home;