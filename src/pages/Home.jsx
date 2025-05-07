import React from "react";
import Hero from "../components/Hero";
import Recommended from "../components/Recommended"; // ✅ Import this
import CTASection from "../components/CTASection";
import RecentAdverts from "../components/RecentAdverts";


function Home() {
    return (
        <>
            <Hero />
            <RecentAdverts />

            <Recommended /> {/* ✅ Add this line */}
            <CTASection />
        </>
    );
}

export default Home;
