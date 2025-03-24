import React from "react";

const Footer = () => {
    return (
        <div className="flex fixed bottom-0 left-0 z-50 w-full">
            <div className="h-fill w-2/5 bg-gradient-to-r from-transparent to-white/40"></div>
            <footer className="flex-1 bg-gradient-to-r from-white/40 via-white/75 to-white/40 text-gray-600 text-center flex overflow-auto justify-center">
                <span className="">
                    &copy; {new Date().getFullYear()} Wakes. All rights reserved.
                </span>
            </footer>
            <div className="h-fill w-2/5 bg-gradient-to-l from-transparent to-white/40"></div>
        </div>

    );
};

export default Footer;