import { useState } from "preact/hooks";
import {
  resourcesStampLinks,
  socialLinks,
  stampChainLinks,
} from "$islands/datacontrol/Layout.ts";
import { FooterStyles } from "./styles.ts";

export function Footer() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <footer className="
      px-3 tablet:px-6 desktop:px-12 py-6 tablet:py-18
      max-w-desktop w-full mx-auto flex flex-col tablet:flex-row justify-between gap-2 mobileLg:gap-3 tablet:gap-4
    ">
      <img
        src="/img/home/stampchain-logo-480.svg"
        alt=""
        class="
          absolute
          w-[210px] mobileLg:w-[270px] tablet:w-[190px]
          h-[210px] mobileLg:h-[270px] tablet:h-[190px]
          bottom-[31px] mobileLg:bottom-[28px] tablet:bottom-[4px]
          left-[calc(50%+18px)] mobileLg:left-[calc(50%+69px)] tablet:left-[296px] desktop:left-[320px]
          pointer-events-none
          opacity-25 tablet:opacity-30
          z-[-999]
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,1))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,1))]
        
        "
      />
      <div className="w-full flex flex-col gap-1 items-center tablet:items-start">
        <p className={FooterStyles.footerLogo}>
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className={FooterStyles.footerTagline}>
          IMMORTALISED ART - STORED ON BITCOIN
        </p>
        <div className="flex flex-row tablet:hidden justify-center w-full gap-[18px] mobileLg:gap-6 leading-4 text-right mb-1 mobileLg:mb-2">
          {stampChainLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              f-partial={!link.isExternal ? link.href : undefined}
              className={FooterStyles.navContent +
                (link?.hiddenOnMobile ? " hidden" : "")}
              target={link.isExternal ? "_blank" : undefined}
            >
              {link.title}
            </a>
          ))}
        </div>
        <div className="flex">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={hoveredIndex === index ? link.hoverIcon : link.icon}
                className={`w-[31px] h-[31px] mobileLg:w-[39px] mobileLg:h-[39px] my-1.5 tablet:my-0 ${
                  index === 0
                    ? "mr-[13px]"
                    : index === 1
                    ? "mr-[17px]"
                    : index === 2
                    ? "mr-[21px]"
                    : ""
                }`}
                alt=""
                onMouseEnter={() =>
                  setHoveredIndex(index)}
                onMouseLeave={() =>
                  setHoveredIndex(null)}
              />
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col tablet:flex-row w-full justify-end tablet:justify-between tablet:pt-3">
        <div className="flex flex-col w-full tablet:w-1/2 items-center tablet:items-start gap-1.5">
          <p className={FooterStyles.footerNavTitle}>RESOURCES</p>
          <div className="flex flex-row tablet:flex-col w-full justify-center gap-[18px] mobileLg:gap-6 tablet:gap-1">
            {resourcesStampLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className={FooterStyles.navContent}
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title}
              </a>
            ))}
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className={`${FooterStyles.navContent} block tablet:hidden`}
            >
              TERMS
            </a>
          </div>
        </div>

        <div className="hidden flex-col tablet:flex w-full tablet:w-1/2 justify-center gap-1.5 text-right">
          <p className={FooterStyles.footerNavTitle}>STAMPCHAIN</p>
          <div className="flex flex-col w-full gap-1">
            {stampChainLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className={FooterStyles.navContent}
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title}
              </a>
            ))}
          </div>

          <p
            className={`${FooterStyles.copyright} hidden tablet:block mt-[9px]`}
          >
            <span className="italic font-bold">STAMPCHAIN</span> @ 2025
          </p>
        </div>

        <p
          className={`${FooterStyles.copyright} block tablet:hidden text-center mt-[18px] mobileLg:mt-6`}
        >
          <span className="italic font-bold">STAMPCHAIN</span> @ 2025
        </p>
      </div>
    </footer>
  );
}
