'use client'

import React from "react";
import styles from "./NavBar.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavBar = () => {

    const pathName = usePathname();

    return (

        <nav className={styles.navBar}>
            <Link className={pathName === '/' ? styles.active : ""} href="/">Home</Link>
            <Link className={pathName === '/draw' ? styles.active : ""} href="/draw">Draw</Link>
            <Link className={pathName === '/fight' ? styles.active : ""} href="/fight">Fight</Link>
            <Link className={pathName === '/leaderboard' ? styles.active : ""} href="/leaderboard">Leaderboard</Link>
        </nav>

    );
};

export default NavBar;
