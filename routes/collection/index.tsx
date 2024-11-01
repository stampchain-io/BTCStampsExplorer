import { FreshContext, Handlers } from "$fresh/server.ts";
import { CollectionOverviewCard } from "$components/collection/CollectionOverviewCard.tsx";
import { CollectionController } from "$server/controller/collectionController.ts";

type CollectionPageProps = {
  data: {
    collections: CollectionRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    selectedTab: "all" | "stamps" | "posh";
    sortBy: string;
    filterBy: string[];
  };
};

export const handler: Handlers = {
  async GET(req: Request, ctx: FreshContext) {
    const url = new URL(req.url);
    const sortBy = url.searchParams.get("sortBy")?.toUpperCase() == "ASC"
      ? "ASC"
      : "DESC";
    const filterBy = url.searchParams.get("filterBy")?.split(",") || [];
    const selectedTab = url.searchParams.get("ident") || "all";
    const page = parseInt(url.searchParams.get("page") || "1");
    const page_size = parseInt(url.searchParams.get("limit") || "20");

    const collectionsData = await CollectionController.getCollectionNames({
      limit: page_size,
      page: page,
      creator: "",
    });

    const data = {
      collections: collectionsData.data,
      page: collectionsData.page,
      pages: collectionsData.totalPages,
      page_size: collectionsData.limit,
      filterBy,
      sortBy,
      selectedTab,
    };
    return await ctx.render(data);
  },
};

export default function Collection(props: CollectionPageProps) {
  const {
    collections,
    page,
    pages,
    page_size,
    filterBy,
  } = props.data;

  return (
    <div className="text-[#CCCCCC] flex flex-col gap-36">
      <section className="flex flex-col gap-36">
        <div className="flex flex-col gap-6">
          <h1 className="text-6xl purple-gradient1 font-black">
            COLLECTIONS
            <p className="text-5xl font-extralight text-[#AA00FF]">
              LATEST POSH STAMPS
            </p>
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6 mt-6">
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
          </div>
          <a
            href="/collection/overview"
            f-partial="/collection/overview"
          >
            <button className="font-extrabold text-[#660099] border-2 border-[#660099] rounded-md px-5 py-3 float-end">
              VIEW ALL
            </button>
          </a>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="gray-gradient3 text-6xl font-black">
            ESPECIALLY POSH
            <h3 className="text-5xl font-extralight">
              STAMP COLLECTIONS
            </h3>
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
          </div>
          <div>
            <h3 className="text-5xl font-extralight">NAMED ASSETS</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-xl font-medium">
              <p>
                Posh stamps are an advanced version of cursed stamps integrated
                with the Counterparty asset-naming system.<br />
                <br />
                While they require additional steps to acquire XCP to conform to
                the Counterparty Meta-Protocol rules,{" "}
                <span className="font-bold">
                  this allows artists to create a vanity name on-chain for their
                  stamps and collections.
                </span>
              </p>
              <p>
                <span className="font-bold">
                  With the Stampchain stamping tool we've made it smooth and
                  frictionless to create Posh stamps.
                </span>
                <br />
                We handle the XCP fee and you pay in BTC.<br />
                <br />
                Your most treasured art can now have unique names, instead of
                just arbitrary numbers.
              </p>
            </div>
          </div>
          <a
            href="/collection/overview"
            f-partial="/collection/overview"
          >
            <button className="bg-[#999999] font-extrabold text-[#080808] px-5 py-3 rounded-md float-right">
              STAMP
            </button>
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-36">
        <div className="flex flex-col gap-6">
          <p className="text-5xl font-extralight text-[#AA00FF]">
            RECENT RECURSIVE STAMPS
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 2xl:grid-cols-6 gap-6">
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" className="hidden md:block" />
            <img src="/img/mock.png" className="hidden md:block" />
            <img src="/img/mock.png" className="hidden 2xl:block" />
            <img src="/img/mock.png" className="hidden 2xl:block" />
            <img src="/img/mock.png" className="hidden 2xl:block" />
            <img src="/img/mock.png" className="hidden 2xl:block" />
          </div>
          <a
            href="/collection/overview"
            f-partial="/collection/overview"
          >
            <button className="font-extrabold text-[#660099] border-2 border-[#660099] rounded-md px-5 py-3 float-end">
              VIEW ALL
            </button>
          </a>
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="gray-gradient3 text-6xl font-black">
            CUTTING EDGE
            <h3 className="text-5xl font-extralight">SRC-721r COLLECTIONS</h3>
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
            <img src="/img/mock.png" />
          </div>
          <div>
            <h3 className="text-5xl font-extralight">RECURSIVE LAYERING</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-xl font-medium">
              <p>
                <span className="font-bold">
                  SRC-721r allows for recursive NFT creation
                </span>{" "}
                by leveraging multiple layers of data utilizing not just JSON,
                but also on-chain JS libraries to build complex recursion and
                on-chain web applications.<br />
                <br />
                Its structure maximizes cost efficiency, making it suitable for
                larger, more detailed and animated art collections.
              </p>
              <p>
                Get in contact with us if you're planning a large PFP collection
                or dreaming of complex multilayered art compositions.<br />
                <br />
                <span className="font-bold">
                  We would love to get involved and can definitely help you out
                  !
                </span>
              </p>
            </div>
          </div>
          <a
            href="/"
            f-partial="/"
          >
            <button className="border-2 border-[#999999] bg-transparent font-extrabold text-[#999999] px-5 py-3 rounded-md float-right">
              CONTACT
            </button>
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h1 className="text-6xl purple-gradient1 font-black">
          POPULAR ARTIST
          <p className="text-5xl font-extralight text-[#AA00FF]">COLLECTIONS</p>
        </h1>
        <div class="flex flex-col gap-4">
          {/* <CollectionCreateButton /> */}
          <div className="flex flex-col gap-6">
            {collections.map((collection) => (
              <CollectionOverviewCard
                key={collection.collection_id}
                collection={collection}
              />
            ))}
          </div>
        </div>
        <a
          href="/collection/overview"
          f-partial="/collection/overview"
        >
          <a
            href="/collection/overview"
            f-partial="/collection/overview"
          >
            <button className="font-extrabold text-[#660099] border-2 border-[#660099] rounded-md px-5 py-3 float-end">
              VIEW ALL
            </button>
          </a>
        </a>
      </section>
    </div>
  );
}
