import { useState } from "preact/hooks";
import { InputField } from "$islands/stamping/InputField.tsx";

const AboutContact = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  return (
    <>
      <section className="mobileLg:mt-36 mt-24">
        <form>
          <div className="w-full flex flex-col justify-center items-start">
            <h1 className="text-stamp-grey font-work-sans font-black desktop:text-5xl mobileMd:text-4xl text-3xl">
              CONTACT
            </h1>
            <h3 className="text-stamp-grey font-work-sans font-extralight desktop:text-4xl mobileMd:text-2xl text-xl">
              DROP US A MESSAGE
            </h3>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <div className="mobileMd:col-span-6 col-span-12">
              <p className="text-stamp-grey text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
                vulputate, lacus at faucibus fringilla, urna urna pretium magna,
                et porttitor odio massa sit amet arcu.
              </p>
              <p className="text-stamp-grey text-lg">
                Curabitur dolor elit, ornare at dolor in, interdum laoreet
                dolor. Pellentesque ut diam erat. Pellentesque id gravida
                tortor. Praesent lacus diam, imperdiet at orci at, venenatis
                vulputate velit.
              </p>
            </div>
            <div className="mobileMd:col-span-6 col-span-12">
              <div className="flex flex-row justify-between items-center gap-2">
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
              <br />
              <InputField
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.currentTarget.value)}
                placeholder="Subject"
              />
              <br />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.currentTarget.value)}
                className="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC] min-h-[120px] font-work-sans"
                placeholder="Message"
              />
            </div>
          </div>
          <div className="w-full flex justify-end items-center">
            <button
              type="submit"
              className="uppercase border tablet:border-2 border-[#999999] rounded-md bg-transparent text-[#999999] font-extrabold w-[63px] tablet:w-[84px] h-[36px] tablet:h-[48px] flex justify-center items-center"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </>
  );
};

export default AboutContact;
