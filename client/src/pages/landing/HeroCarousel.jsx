import { useEffect, useMemo, useRef, useState } from "react";
import "./heroCarousel.css";

export default function HeroCarousel({ images = [], intervalMs = 3500 }) {
    const [index, setIndex] = useState(0);

    const [paused, setPaused] = useState(false);
    const resumeTimerRef = useRef(null);

    const count = images.length;

    const safeImages = useMemo(() => {
        return Array.isArray(images) ? images.filter(Boolean) : [];
    }, [images]);

    // Auto scroll
    useEffect(() => {
        if (count <= 1) return;
        if (paused) return;

        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % count);
        }, intervalMs);

        return () => clearInterval(id);
    }, [count, paused, intervalMs]);

    useEffect(() => {
        if (count === 0) return;
        if (index >= count) setIndex(0);
    }, [count, index]);

    const pauseAndResumeLater = () => {
        setPaused(true);

        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);

        resumeTimerRef.current = setTimeout(() => {
            setPaused(false);
        }, 10000);
    };

    useEffect(() => {
        return () => {
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };
    }, []);

    if (safeImages.length === 0) return null;

    return (
        <div className="hc">
            <div
                className="hc-track"
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {safeImages.map((src, i) => (
                    <div className="hc-slide" key={src + i}>
                        <img
                            className="hc-img"
                            src={src}
                            alt={`Hero ${i + 1}`}
                        />
                    </div>
                ))}
            </div>

            <div
                className="hc-dots"
                role="tablist"
                aria-label="Hero carousel dots"
            >
                {safeImages.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`hc-dot ${i === index ? "is-active" : ""}`}
                        onClick={() => {
                            setIndex(i);
                            pauseAndResumeLater();
                        }}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-selected={i === index}
                        role="tab"
                    />
                ))}
            </div>
        </div>
    );
}
