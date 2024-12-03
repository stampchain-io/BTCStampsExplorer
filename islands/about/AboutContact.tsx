import { useState } from "preact/hooks";
import { InputField } from "$islands/stamping/InputField.tsx";

const AboutContact = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";
  const inputField1col = "flex gap-3 mobileMd:gap-6 w-full";
  const inputField2col =
    "flex flex-col mobileMd:flex-row gap-3 mobileMd:gap-6 w-full";
  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  return (
    <>
      <section>
        <div className="flex flex-col">
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
              vulputate, lacus at faucibus fringilla, urna urna pretium magna,
              et porttitor odio massa sit amet arcu.
            </p>
            <p className={bodyTextLight}>
              Curabitur dolor elit, ornare at dolor in, interdum laoreet dolor.
              Pellentesque ut diam erat. Pellentesque id gravida tortor.
              Praesent lacus diam, imperdiet at orci at, venenatis vulputate
              velit.
            </p>
          </div>
          <div className="w-full mobileLg:w-1/2">
            <form className="flex flex-col gap-3 mobileMd:gap-6">
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
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutContact;
