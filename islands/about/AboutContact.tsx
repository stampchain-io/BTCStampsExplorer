/* TODO @REINAMORA:  Update the contact form to be able to send emails */
/* ===== ABOUT CONTACT COMPONENT ===== */
import { useState } from "preact/hooks";
import { InputField } from "$forms";
import { ButtonProcessing } from "$buttons";
import { subtitleGrey, text, titleGreyLD } from "$text";
import { gapGrid, rowForm, rowResponsiveForm } from "$layout";

/* ===== STATE ===== */
const AboutContact = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ===== EVENT HANDLERS ===== */
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(
      "Contact form is not setup properly - leave a message on Telegram instead",
    );
    setIsSubmitting(false);
  };

  /* ===== COMPONENT ===== */
  return (
    <>
      <section>
        {/* ===== HEADER SECTION ===== */}
        <div className="flex flex-col">
          <h1 className={titleGreyLD}>
            CONTACT
          </h1>
          <h3 className={subtitleGrey}>
            DROP US A MESSAGE
          </h3>
        </div>
        {/* ===== CONTENT SECTION ===== */}
        <div className={`flex flex-col mobileLg:flex-row ${gapGrid}`}>
          {/* ===== DESCRIPTION TEXT ===== */}
          <div className="w-full mobileLg:w-full">
            <p className={text}>
              Reach out if you have any questions about stamps, our tooling and
              services.
            </p>
            <p className={text}>
              Need guidance on deploying a community token or assistance with
              stamping your future art project ?<br />
              Got ideas for a collaboration, improvements or protocol
              integration ?
            </p>
            <p className={text}>
              <a
                href="https://t.me/BitcoinStamps"
                target="_blank"
                className="animated-underline"
              >
                Get in touch via Telegram
              </a>{" "}
              - and let's explore the infinite possibilities of stamps together
              !
            </p>
          </div>

          {/* ===== CONTACT FORM ===== */}
          <div className="hidden w-full mobileLg:w-1/2 pt-3 mobileLg:pt-0">
            <form
              className="flex flex-col gap-6"
              onSubmit={handleSubmit}
            >
              {/* ===== NAME AND EMAIL FIELDS ===== */}
              <div className={rowResponsiveForm}>
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

              {/* ===== SUBJECT FIELD ===== */}
              <div className={rowForm}>
                <InputField
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.currentTarget.value)}
                  placeholder="Subject"
                />
              </div>

              {/* ===== MESSAGE FIELD ===== */}
              <div className={rowForm}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.currentTarget.value)}
                  className="h-[108px] mobileMd:h-[120px] p-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
                  placeholder="Message"
                />
              </div>

              {/* ===== SUBMIT BUTTON ===== */}
              <div className="w-full flex justify-end">
                <ButtonProcessing
                  type="submit"
                  variant="outline"
                  color="grey"
                  size="lg"
                  isSubmitting={isSubmitting}
                >
                  SEND
                </ButtonProcessing>
              </div>

              {/* ===== ERROR MESSAGE ===== */}
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutContact;
