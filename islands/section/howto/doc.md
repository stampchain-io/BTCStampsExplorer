/**
 * How-To Modules Documentation
 * ==========================
 * 
 * Overview
 * --------
 * The How-To modules are short intro guides that explain how to use the stamp tooling.
 * They are based upon the How-To articles and the intro guide modules all include a "Read More" button linking to the specific article, that goes more into depth on the subject.
 * 
 * Module Files
 * -----------
 * Current modules in /islands/howto/:
 * - HowToStamp.tsx
 * - HowToTransferStamp.tsx
 * - HowToDeployToken.tsx
 * - HowToMintToken.tsx
 * - HowToTransferToken.tsx
 * - HowToRegisterBiname.tsx
 * - HowToTransferBitname.tsx
 * - doc.md (this documentation)
 * 
 * Creating a New Module
 * -------------------
 * To add a new How-To module:
 * 
 * 1. Create a new .tsx file in /islands/howto/
 * @example
 * // HowToTemplate.tsx
 * export default function HowToTemplate() {
 *   return (
 *     <div>
 *       <h1>How to [Action]</h1>
 *       <div className="steps">
 *         {/* Add your steps here */}
 *       </div>
 *       <a href="/howto/[action-guide]">Read More</a>
 *     </div>
 *   );
 * }
 * 
 * - Alternately copy the code of one of the existing guides and paste it into a new file, updating the text content and button link
 *
 * Best Practices
 * -------------
 * 1. Naming Convention
 *    - Prefix with "HowTo"
 *    - Use CamelCase
 *    - Be descriptive (e.g., HowToMintToken)
 * 
 * 2. Content Guidelines
 *    - Keep instructions concise
 *    - Focus on essential steps
 *    - Always include "Read More" link
 *    - Link to detailed article
 * 
 * Module Purpose
 * -------------
 * - Provide quick start guides
 * - Highlight key steps
 * - Direct users to detailed documentation
 * - Maintain consistent user experience
 * 
 * @lastUpdated April 4, 2025
 * @author baba
 */
