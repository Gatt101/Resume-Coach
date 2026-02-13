"use client";

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Brain, Menu, X } from "lucide-react";
import * as React from "react";
import { useRef, useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-4 z-40 w-full px-4", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(20px) saturate(180%)" : "blur(12px) saturate(150%)",
        backgroundColor: visible 
          ? "rgba(255, 255, 255, 0.1)" 
          : "rgba(255, 255, 255, 0.05)",
        borderColor: visible 
          ? "rgba(255, 255, 255, 0.3)" 
          : "rgba(255, 255, 255, 0.2)",
        boxShadow: visible
          ? "0 8px 32px rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          : "0 4px 16px rgba(31, 38, 135, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        width: visible ? "65%" : "100%",
        y: visible ? 8 : 0,
        scale: visible ? 0.98 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 40,
        mass: 0.8,
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-6xl flex-row items-center justify-between rounded-full border px-6 py-3 lg:flex",
        "bg-white/5 dark:bg-black/5 backdrop-blur-md",
        "shadow-[0_8px_32px_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        "border-white/20 dark:border-white/10",
        className,
      )}
      style={{
        background: visible 
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
      }}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium lg:flex pointer-events-none",
        className,
      )}
    >
      {items.map((item, idx) => (
        <motion.a
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative px-4 py-2 text-foreground/70 hover:text-foreground transition-colors duration-300 rounded-full pointer-events-auto"
          key={`link-${idx}`}
          href={item.link}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-full backdrop-blur-md"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 15px rgba(255, 255, 255, 0.1)"
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30
              }}
            />
          )}
          <span className="relative z-20 font-medium">{item.name}</span>
        </motion.a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(20px) saturate(180%)" : "blur(12px) saturate(150%)",
        backgroundColor: visible 
          ? "rgba(255, 255, 255, 0.1)" 
          : "rgba(255, 255, 255, 0.05)",
        borderColor: visible 
          ? "rgba(255, 255, 255, 0.3)" 
          : "rgba(255, 255, 255, 0.2)",
        boxShadow: visible
          ? "0 8px 32px rgba(31, 38, 135, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
          : "0 4px 16px rgba(31, 38, 135, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        width: visible ? "95%" : "100%",
        paddingRight: visible ? "12px" : "16px",
        paddingLeft: visible ? "12px" : "16px",
        borderRadius: visible ? "16px" : "24px",
        y: visible ? 8 : 0,
        scale: visible ? 0.98 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 40,
        mass: 0.8,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between border rounded-3xl px-4 py-3 lg:hidden",
        "bg-white/5 dark:bg-black/5 backdrop-blur-md",
        "shadow-[0_8px_32px_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        "border-white/20 dark:border-white/10",
        className,
      )}
      style={{
        background: visible 
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
      }}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-2xl border px-4 py-6 backdrop-blur-md",
            "bg-white/10 dark:bg-black/10",
            "border-white/20 dark:border-white/10",
            "shadow-[0_8px_32px_rgba(31,38,135,0.2)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            className,
          )}
          style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)",
            backdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.button
      whileHover={{ 
        scale: 1.05,
        backgroundColor: "rgba(255, 255, 255, 0.1)"
      }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle menu"
      className="rounded-xl p-2 transition-all duration-300 backdrop-blur-sm"
      onClick={onClick}
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -180, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 180, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <X className="size-5" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 180, opacity: 0, scale: 0.8 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -180, opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <Menu className="size-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const NavbarLogo = () => {
  return (
    <motion.a
      href="#"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal"
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      <motion.div
        className="size-8 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground grid place-items-center shadow-lg"
        whileHover={{ 
          rotate: 5,
          scale: 1.1,
          boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20
        }}
      >
        <Brain className="size-4" />
      </motion.div>
      <span className="font-semibold text-foreground">NexCV Coach</span>
    </motion.a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-full text-sm font-medium relative cursor-pointer inline-block text-center backdrop-blur-sm transition-all duration-300";

  const variantStyles = {
    primary: "bg-primary/80 text-primary-foreground hover:bg-primary shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] border border-primary/20",
    secondary: "border border-white/20 bg-white/10 hover:bg-white/20 text-foreground backdrop-blur-md shadow-[0_4px_15px_rgba(255,255,255,0.1)]",
    dark: "bg-black/80 text-white hover:bg-black border border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.3)]",
    gradient: "bg-gradient-to-r from-blue-500/80 to-purple-600/80 text-white hover:from-blue-500 hover:to-purple-600 border border-blue-400/20 shadow-[0_4px_15px_rgba(99,102,241,0.3)]",
  };

  return (
    <motion.div 
      whileHover={{ 
        scale: 1.02,
        y: -2
      }} 
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      <Tag
        href={href || undefined}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </Tag>
    </motion.div>
  );
};
