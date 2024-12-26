/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";

// Intentional formatting issues (extra spaces, missing semicolons)
export default function   ReviewDogTest() {
    const [count,setCount]=useState<number>(0)
    
    // Intentional linting issues
    const unused_variable = "test"
    console.log("test")  // eslint should flag console.log

    return(
        <div class="p-4">  {/* class instead of className to trigger lint */}
            <h1 style={{color:'red',fontSize:"20px"}}>  {/* inconsistent quote usage */}
                ReviewDog Test Component
            </h1>
            <button onClick={()=>setCount(count+1)}>
                Count: {count}
            </button>
        </div>
    )
}
