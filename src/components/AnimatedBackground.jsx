import { motion } from "framer-motion";

// Softly animated deep-space background with drifting aurora orbs
export function AnimatedBackground({ pageAccent = "#7C6DFA" }) {
  const orbs = [
    {
      id: 1,
      color: "#4C35D4",
      size: 520,
      x: "10%",
      y: "5%",
      duration: 18,
      delay: 0,
    },
    {
      id: 2,
      color: "#1A1060",
      size: 400,
      x: "65%",
      y: "15%",
      duration: 22,
      delay: 4,
    },
    {
      id: 3,
      color: "#0D2A3A",
      size: 450,
      x: "30%",
      y: "55%",
      duration: 25,
      delay: 8,
    },
    {
      id: 4,
      color: "#1E1040",
      size: 350,
      x: "80%",
      y: "65%",
      duration: 20,
      delay: 2,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "#080810",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Subtle noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          backgroundSize: "256px 256px",
          opacity: 0.6,
        }}
      />

      {/* Drifting aurora orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          animate={{
            x: ["-4%", "4%", "-2%", "4%", "-4%"],
            y: ["-4%", "2%", "5%", "-2%", "-4%"],
            scale: [1, 1.08, 0.96, 1.04, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${orb.color} 0%, transparent 70%)`,
            filter: "blur(60px)",
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}

      {/* Page accent glow — shifts per active tab */}
      <motion.div
        key={pageAccent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        style={{
          position: "absolute",
          bottom: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "40%",
          background: `radial-gradient(ellipse at bottom, ${pageAccent}18 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
      />

      {/* Top vignette */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "200px",
          background:
            "linear-gradient(to bottom, rgba(8,8,16,0.8) 0%, transparent 100%)",
        }}
      />

      {/* Bottom vignette */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "160px",
          background:
            "linear-gradient(to top, rgba(8,8,16,0.9) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
