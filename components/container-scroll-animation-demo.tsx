"use client";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export default function HeroScrollDemo() {
  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Smarter Resumes. <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Stronger Careers.
              </span>
            </h1>
          </>
        }
      >
        <img
          src="/hero.png"
          alt="NexCV Coach Dashboard"
          className="mx-auto rounded-2xl object-cover h-full w-full object-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
}
