import React, { useEffect } from "react";
import Hero from "../components/Hero";
import Recommended from "../components/Recommended"; // ✅ Import this
import CTASection from "../components/CTASection";
import RecentAdverts from "../components/RecentAdverts";

function Home() {
    useEffect(() => {
        // Set page title
        document.title = "My Pet Connect - Find Local Stud Dogs & Pets for Sale";

        // Set meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        metaDescription.content = 'Connect with local pet owners to find stud dogs, puppies for sale, cats, kittens, and rabbits. Safe, verified listings in your area.';
    }, []);

    return (
        <>
            <Hero />

            {/* Dogs */}
            <RecentAdverts category="dogs" intent="sale" title="Recent Adverts In Dogs For Sale" limitCount={8} />
            <RecentAdverts category="dogs" intent="stud" title="Recent Adverts In Dogs For Stud" limitCount={8} />

            {/* Cats */}
            <RecentAdverts category="cats" intent="stud" title="Recent Adverts In Cats For Stud" limitCount={8} />
            <RecentAdverts category="cats" intent="sale" title="Recent Adverts In Cats For Sale" limitCount={8} />

            {/* Rabbits (leave as one for now) */}
            <RecentAdverts category="rabbits" title="Recent Adverts In Rabbits For Sale" limitCount={8} />

            <CTASection />
        </>
    );
}

export default Home;