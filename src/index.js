import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs,
  addDoc, limit, orderBy, query, onSnapshot, where, doc,updateDoc,
   serverTimestamp, startAfter,} from 'firebase/firestore'
  import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes, getStorage,
  ref,
} from "firebase/storage";

import { createUserWithEmailAndPassword, getAuth, signOut,
  signInWithEmailAndPassword, onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvYf2-mdKC_TsoI7fpoVK5B0C4CeRJuis",
  authDomain: "imagediarynk.firebaseapp.com",
  projectId: "imagediarynk",
  storageBucket: "imagediarynk.firebasestorage.app",
  messagingSenderId: "185040970597",
  appId: "1:185040970597:web:fc191de4a14ceec828f78c",
  measurementId: "G-1JW7YWPW2F"
};


  initializeApp(firebaseConfig)
  const db = getFirestore() // refers to the database

  const colRef = collection(db, 'entries') //refers to the collection within the database

const auth = getAuth() // refers to the Authentication service
const storage = getStorage(); // refers to the firestore storage
let loggedIn

  //Database entry debugging,  each time there is an addition to the database refresh the snapshot displayed in console.. 
//   onSnapshot(colRef, (snapshot) => {
// let entries = []
// snapshot.docs.forEach((doc) => {
//   entries.push({ ...doc.data(), id: doc.id })
// })
// console.log(entries)
// })



 //check current HTML current page to decide which section of code to run
const currentPage = document.body.getAttribute("data-page");

 if (currentPage === "index") {
    async function getDailyEntry() {
      
      // Create a query to get all entries ordered by entryDate in ascending order (oldest first)
      const q = query(colRef, orderBy("entryDate", "asc"));
      // Execute the query
      const querySnapshot = await getDocs(q);
    
      // Extract all entries into an array
      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });
    
      // Check if there are any entries
      if (entries.length > 0) {
        // Calculate which entry to display based on the current date
        const today = new Date();
        const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24)); // Days since Unix epoch
        
        // Select the entry for today (the first entry in the list should be the oldest)
        const entryIndex = daysSinceEpoch % entries.length; // Loop through entries cyclically
    
        // Get the entry for today
        const dailyEntry = entries[entryIndex];
    
        // Select the container element
        const todayEntryElement = document.getElementById("todayentry");
    
        // Construct the HTML to display the entry
        const entryHTML = `
          <img src="${dailyEntry.image}" alt="Entry Image" style="max-width: 100%; height: auto;">
          <p>${dailyEntry.text}</p>
          <p><strong>${dailyEntry.imageDate}</strong></p>
        `;
    
        // Update the element's content
        todayEntryElement.innerHTML = entryHTML;
    
        // Mark this entry as displayed on the daily page
        const docRef = doc(db, 'entries', dailyEntry.id);
        await updateDoc(docRef, { displayedOnDaily: true });
    
      } else {
        // Handle the case where there are no entries
        document.getElementById("todayentry").innerHTML = "<p>No entries found. This must be an error...</p>";
      }
    }
    
    // Call the function to display the daily entry
    getDailyEntry();
    
  }
  


else if (currentPage === "archive") {
  let lastVisible = null; // Tracks the last document in the current page
  let currentPage = 1; // Tracks the current page number
  const pageSize = 6; // Number of entries per page
async function displayEntries(page = 1) {
  const colRef = collection(db, "entries");
  let q = query(colRef, where("displayedOnDaily", "==", true), orderBy("entryDate", "asc"), limit(pageSize));

  if (lastVisible && page > 1) {
    q = query(colRef, where("displayedOnDaily", "==", true), orderBy("entryDate", "asc"), startAfter(lastVisible), limit(pageSize));
  }

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const container = document.getElementById("entriesarchive");
    container.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const entry = doc.data();
      const entryHTML = `
        <div class="entry">
          <img src="${entry.image || "default-image.png"}" alt="Entry Image" style="max-width: 100%; height: auto;">
          <p>${entry.text || "No text available."}</p>
          <p><strong>${entry.imageDate}</strong></p>
        </div>
      `;
      container.innerHTML += entryHTML;
    });

    document.getElementById("paginationInfo").innerText = `Page ${page}`;
  } else {
    console.log("No more entries to display.");
    document.getElementById("entriesContainer").innerHTML = "<p>No more entries available.</p>";
  }
}

  
  // Initialize first page
  displayEntries();
  function nextPage() {
    currentPage += 1;
    displayEntries(currentPage);
  }
  window.nextPage = nextPage; // Expose the function globally
  
  function prevPage() {
    if (currentPage > 1) {
      currentPage -= 1;
      displayEntries(currentPage);
    }
  }
  window.prevPage = prevPage; // Expose the function globally
  

}

if (currentPage === "login") {
  // Monitor authentication state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.assign("post.html");
    } else {
      console.log("User not logged in");
      const loginForm = document.querySelector(".login");

      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        signInWithEmailAndPassword(auth, email, password)
          .then(() => {
            console.log("User logged in");
            window.location.assign("post.html");
          })
          .catch((err) => {
            console.error("Login error:", err.message);
          });
      });
    }
  });
}

if (currentPage === "post") {
  // Monitor authentication state
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.assign("login.html");
    } else {
      console.log("User is logged in");

      // Upload Image Function
      async function uploadImage() {
        const file = document.getElementById("image-file").files[0];
        const storageRef = ref(storage, `entryImages/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        console.log("Image successfully uploaded");
        return getDownloadURL(uploadResult.ref);
      }

      // Add Entry Form
      const addEntry = document.querySelector(".addEntry");
      addEntry.addEventListener("submit", async (e) => {
        e.preventDefault();

        const imageUrl = await uploadImage();

        // Add entry to Firestore
        await addDoc(colRef, {
          entryDate: serverTimestamp(),
          image: imageUrl,
          imageDate: addEntry.imageDate.value,
          text: addEntry.text.value,
          displayedOnDaily: false,
        });
        console.log("Entry added successfully");
        addEntry.reset();
      });

      // Logout Button
      const logoutButton = document.querySelector(".logout");
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault();

        signOut(auth)
          .then(() => {
            console.log("User signed out");
            window.location.assign("login.html");
          })
          .catch((err) => {
            console.error("Logout error:", err.message);
          });
      });
    }
  });
}