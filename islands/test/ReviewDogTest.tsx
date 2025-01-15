import { useState } from "preact/hooks";

export default function ReviewDogTest() {
    const [count,setState]=useState(0)
    
    const increment=()=>{
        setState(count+1)
    }
    
    return (
        <div>
            <h1>Review Dog Test Component</h1>
                <p>Count: {count}</p>
            <button onClick={increment}>
                Increment
                </button>
        </div>
    );
}
