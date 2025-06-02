import React from "react";
import Hero from "../components/Hero";
import Recommended from "../components/Recommended"; // ✅ Import this
import CTASection from "../components/CTASection";
import RecentAdverts from "../components/RecentAdverts";

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"/>


function Home() {
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
