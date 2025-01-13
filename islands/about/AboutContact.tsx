import { useState } from "preact/hooks";
import { InputField } from "$islands/stamping/InputField.tsx";

const AboutContact = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const inputField1col = "flex gap-3 mobileMd:gap-6 w-full";
  const inputField2col =
    "flex flex-col mobileMd:flex-row gap-3 mobileMd:gap-6 w-full";
  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError(
      "Contact form is not setup properly - leave a message on Telegram instead",
    );
  };

  return (
    <>
      <section>
        <div className="flex flex-col w-full mobileLg:w-1/2">
          <h1 className={titleGreyDL}>
            CONTACT
          </h1>
          <h3 className={subTitleGrey}>
            DROP US A MESSAGE
          </h3>
        </div>
        <div className="flex flex-col mobileLg:flex-row gap-3 mobileMd:gap-6">
          <div className="w-full mobileLg:w-1/2 space-y-3 mobileMd:space-y-6">
            <p className={bodyTextLight}>
              Reach out if you have any questions about stamps, our tooling and
              services. <br />
              <br />
              Need guidance on deploying a community token or assistance with
              stamping your future art project?<br />
              Got ideas for a collaboration, improvements or protocol
              integration? <br />
              <br />
              Send us a message -{" "}
              <a
                href="https://t.me/BitcoinStamps"
                target="_blank"
                className="animated-underline"
              >
                or get in touch via Telegram
              </a>{" "}
              - and let's explore the infinite possibilities of stamps together!
            </p>
          </div>
          <div className="w-full mobileLg:w-1/2 pt-3 mobileLg:pt-0">
            <form
              className="flex flex-col gap-3 mobileMd:gap-6 desktop:gap-9"
              onSubmit={handleSubmit}
            >
              <div className={inputField2col}>
                <InputField
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Name"
                />
                <InputField
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  placeholder="Email"
                />
              </div>
              <div className={inputField1col}>
                <InputField
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.currentTarget.value)}
                  placeholder="Subject"
                />
              </div>
              <div className={inputField1col}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  className="h-[108px] mobileMd:h-[120px] p-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
                  placeholder="Message"
                />
              </div>
              <div className="w-full flex justify-end">
                <button
                  type="submit"
                  className={buttonGreyOutline}
                >
                  SEND
                </button>
              </div>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutContact;
