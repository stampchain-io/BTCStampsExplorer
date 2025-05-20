import { useState } from "preact/hooks";

export default function ReviewDogTest() {
  const [count, setState] = useState(0);

  const increment = () => {
    setState(count + 1);
  };

  return (
    <div class="p-4 space-y-4">
      <h1>Review Dog Test Component</h1>
      <p>Count: {count}</p>
      <button type="button" onClick={increment}>
        Increment
      </button>
    </div>
  );
}
