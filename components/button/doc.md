
/* ===== BUTTON COMPONENT DOCUMENTATION ===== */
/* =====  @baba - UPDATE NEEDED !!! ===== */
/**
 * Button Components
 *
 * @example Normal Button
 * <Button variant="outline" color="grey" size="md">
 *   CLICK ME
 * </Button>
 *
 * @example Icon Button - NEEDS ICON COMPONENT - to be updated
 * <ButtonIcon variant="outline" color="purple" size="md">
 *   <svg>...</svg>
 * </ButtonIcon>
 *
 * @example Icon Button with Loading Spinner
 * import { useButtonActions } from "$islands/shared/actions/buttonActions.tsx";
 *
 * export default function MyComponent() {
 *   const { isActive, activeHandlers } = useButtonActions();
 *
 *   return (
 *     <ButtonIcon
 *       variant="outline"
 *       color="purple"
 *       size="md"
 *       isLoading={true}
 *       isActive={isActive}
 *       {...activeHandlers}
 *     >
 *       <svg>...</svg>
 *     </ButtonIcon>
 *   );
 * }
 *
 * @example Processing Button
 * <ButtonProcessing
 *   variant="outline"
 *   color="grey"
 *   size="md"
 *   isSubmitting={false}
 * >
 *   SUBMIT
 * </ButtonProcessing>
 *
 * @example Processing Button with Active State and Spinner
 * import { useButtonActions } from "$islands/shared/actions/buttonActions.tsx";
 *
 * export default function MyComponent() {
 *   const { isActive, activeHandlers } = useButtonActions();
 *   const [isSubmitting, setIsSubmitting] = useState(false);
 *
 *   const handleSubmit = async () => {
 *     setIsSubmitting(true);
 *     await submitData();
 *     setIsSubmitting(false);
 *   };
 *
 *   return (
 *     <ButtonProcessing
 *       variant="outline"
 *       color="grey"
 *       size="md"
 *       isSubmitting={isSubmitting}
 *       isActive={isActive}
 *       {...activeHandlers}
 *       onClick={handleSubmit}
 *     >
 *       SUBMIT
 *     </ButtonProcessing>
 *   );
 * }
 */
