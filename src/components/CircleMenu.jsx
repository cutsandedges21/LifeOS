import { useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";

// containerSize is read once at module load. Resizing past 380px mid-session
// does not update it — acceptable since users rarely resize during a session.
const CONSTANTS = {
  itemSize: 48,
  triggerSize: 56,
  containerSize: typeof window !== "undefined" && window.matchMedia("(max-width: 380px)").matches ? 200 : 220,
  openStagger: 0.025,
  closeStagger: 0.05,
};

const SMOOTH_EASE = [0.32, 0.72, 0, 1];
// Slow start, accelerating finish — items feel like they "fall" into the trigger
const FALL_EASE = [0.55, 0.06, 0.78, 0.32];
// Vertical drop distance: items collapse to the trigger center, which sits at
// the bottom edge of the items wrapper (height = containerSize, center at half)
const FALL_Y = CONSTANTS.containerSize / 2;

const MUTED = "rgba(255, 255, 255, 0.08)";

// Half-circle arc spanning from left (-π) to right (0), peaking straight up
const pointOnCircle = (i, n, r) => {
  if (n <= 1) {
    return { x: 0, y: -r };
  }
  const theta = -Math.PI + (Math.PI * i) / (n - 1);
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
};

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function MenuItem({ item, index, totalItems, isOpen, isActive, onSelect }) {
  const { x, y } = pointOnCircle(index, totalItems, CONSTANTS.containerSize / 2 - CONSTANTS.itemSize / 2);
  const [hovering, setHovering] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 0,
        height: 0,
        pointerEvents: "none",
      }}
    >
      <motion.button
        onClick={() => onSelect(item.id)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        animate={{
          x: isOpen ? x : 0,
          y: isOpen ? y : FALL_Y,
          opacity: isOpen ? 1 : 0,
          scale: isOpen ? 1 : 0.35,
        }}
        whileHover={{ scale: 1.12, transition: { duration: 0.12 } }}
        whileTap={{ scale: 0.92 }}
        transition={
          isOpen
            ? {
                delay: index * CONSTANTS.openStagger,
                type: "spring",
                stiffness: 320,
                damping: 28,
              }
            : {
                delay: (totalItems - index - 1) * CONSTANTS.closeStagger,
                duration: 0.6,
                ease: FALL_EASE,
              }
        }
        style={{
          position: "absolute",
          left: -(CONSTANTS.itemSize / 2),
          top: -(CONSTANTS.itemSize / 2),
          width: CONSTANTS.itemSize,
          height: CONSTANTS.itemSize,
          borderRadius: "50%",
          background: isActive ? item.color : MUTED,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          color: isActive ? "#F8FAFF" : "rgba(248, 250, 255, 0.7)",
          border: `1px solid ${isActive ? item.color : "rgba(255,255,255,0.10)"}`,
          boxShadow: isActive
            ? `0 0 24px ${item.color}80, 0 6px 18px rgba(0,0,0,0.4)`
            : "0 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: isOpen ? "auto" : "none",
          outline: "none",
        }}
      >
        {item.icon}
        <AnimatePresence>
          {hovering && isOpen && (() => {
            const labelAbove = item.labelAbove ?? true;
            const centered = item.id === "main";
            const leftSide = item.labelLeftSide;
            return (
            <motion.span
              initial={{ opacity: 0, y: labelAbove ? 4 : -4, ...(centered && { x: "-50%" }) }}
              animate={{ opacity: 1, y: 0, ...(centered && { x: "-48%" }) }}
              exit={{ opacity: 0, y: labelAbove ? 4 : -4, ...(centered && { x: "-50%" }) }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                ...(labelAbove
                  ? { bottom: "100%", marginBottom: "8px" }
                  : { top: "100%", marginTop: "8px" }),
                ...(leftSide ? { right: "50%" } : { left: "50%" }),
                transform: "translateX(-50%)",
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                color: "rgba(248, 250, 255, 0.85)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                background: "rgba(0,0,0,0.75)",
                padding: "4px 8px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                zIndex: 100,
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              {item.label}
            </motion.span>
            );
          })()}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

function MenuTrigger({ isOpen, setIsOpen, closeAnimationCallback, activeColor, activeIcon }) {
  const animate = useAnimationControls();

  const closeAnimation = async () => {
    await animate.start({
      scale: [1, 1.18, 1],
      transition: {
        duration: 0.5,
        times: [0, 0.35, 1],
        ease: SMOOTH_EASE,
      },
    });
  };

  return (
    <motion.div style={{ zIndex: 50, position: "relative" }}>
      <motion.button
        animate={animate}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            closeAnimationCallback();
            closeAnimation();
          } else {
            setIsOpen(true);
          }
        }}
        whileTap={{ scale: 0.94 }}
        style={{
          height: CONSTANTS.triggerSize,
          width: CONSTANTS.triggerSize,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
          color: "#F8FAFF",
          border: `1px solid ${activeColor}`,
          boxShadow: `0 0 28px ${activeColor}90, 0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <AnimatePresence mode="popLayout">
          {isOpen ? (
            <motion.span
              key="menu-close"
              initial={{ opacity: 0, filter: "blur(10px)", rotate: -90 }}
              animate={{ opacity: 1, filter: "blur(0px)", rotate: 0 }}
              exit={{ opacity: 0, filter: "blur(10px)", rotate: 90 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex" }}
            >
              <CloseIcon />
            </motion.span>
          ) : (
            <motion.span
              key="menu-open"
              initial={{ opacity: 0, filter: "blur(10px)", scale: 0.5 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)", scale: 0.5 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex" }}
            >
              {activeIcon}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

export function CircleMenu({ items, activeId, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const animate = useAnimationControls();

  const visibleItems = items.filter((it) => !it.hidden);
  const activeItem = visibleItems.find((it) => it.id === activeId) || visibleItems[0];

  const closeAnimationCallback = async () => {
    // Items now collapse downward into the trigger via their own animate prop;
    // no need to spin/blur the rotating layer on close.
  };

  const handleSelect = (id) => {
    if (id !== activeId) onSelect(id);
    setIsOpen(false);
    closeAnimationCallback();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: 0,
        right: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: CONSTANTS.containerSize,
          height: CONSTANTS.containerSize / 2 + CONSTANTS.triggerSize,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        {/* Backdrop dim + blur when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => {
                setIsOpen(false);
                closeAnimationCallback();
              }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: -1,
                pointerEvents: "auto",
              }}
            />
          )}
        </AnimatePresence>

        {/* Trigger sits at bottom center */}
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)" }}>
          <MenuTrigger
            setIsOpen={setIsOpen}
            isOpen={isOpen}
            closeAnimationCallback={closeAnimationCallback}
            activeColor={activeItem?.color || "#7C6DFA"}
            activeIcon={activeItem?.icon}
          />
        </div>

        {/* Items anchor: static wrapper centered on the trigger.
            Framer-motion's rotate would clobber translateX(-50%), so we
            wrap the rotating layer in a plain div that owns the centering. */}
        <div
          style={{
            position: "absolute",
            bottom: CONSTANTS.triggerSize / 2,
            left: "50%",
            transform: "translateX(-50%)",
            width: CONSTANTS.containerSize,
            height: CONSTANTS.containerSize,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={animate}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            {visibleItems.map((item, index) => (
              <MenuItem
                key={item.id}
                item={item}
                index={index}
                totalItems={visibleItems.length}
                isOpen={isOpen}
                isActive={item.id === activeId}
                onSelect={handleSelect}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
