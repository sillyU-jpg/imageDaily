import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs,
  addDoc, limit, orderBy, query, desc, getCountFromServer, getDoc,
   onSnapshot, where, serverTimestamp, startAfter,
   disablePersistentCacheIndexAutoCreation} from 'firebase/firestore'
  import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes, getStorage,
  ref,
} from "firebase/storage";



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


  const db = getFirestore()
  const storage = getStorage();
  //collection refrence
  const colRef = collection(db, 'entries')

  //queries 
  


//gets all docs from c ollection 
function getDate() {
  const date = new Date();
  const time = new Date();
  return date.toLocaleDateString() + " " + time.getHours() + ":" + time.getUTCMinutes();
}

  //each time there is an addition to the database refresh the snapshot
  onSnapshot(colRef, (snapshot) => {
let entries = []
snapshot.docs.forEach((doc) => {
  entries.push({ ...doc.data(), id: doc.id })
})
console.log(entries)
})

 //find current page to decide which section of code to run
const currentPage = document.body.getAttribute("data-page");

if (currentPage === "post") {

  async function uploadImage() {
    const file = document.getElementById("image-file").files[0];
    const storageRef = ref(storage, `entryImages/${Date.now()}_${file.name}`); // Use a unique filename
    const uploadResult = await uploadBytes(storageRef, file);
    console.log("image successfully uploaded")
    return getDownloadURL(uploadResult.ref); 
  }// Return the file URL
    const addEntry = document.querySelector(".addEntry");

    addEntry.addEventListener('submit', async (e) => {
      e.preventDefault();
    
      const imageUrl = await uploadImage();
    
    
      // Add entry to Firestore with the image URL
      addDoc(colRef, {
        entryDate: serverTimestamp(), // Function that gets the current date
        image: imageUrl,      // Store the image URL
        imageDate: addEntry.imageDate.value,
        text: addEntry.text.value,
      });
      document.querySelector(".addEntry").reset();
    });
    
    
      //deleting entries
      const deleteEntry = document.querySelector(".delete")
      deleteEntry.addEventListener('submit', (e) => {
        e.preventDefault()
        window.location.reload()
      })
  }



  else if (currentPage === "index") {

    async function getDailyEntry() {
      // Reference the Firestore collection
      const colRef = collection(db, 'entries');
  
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
    // Reference the Firestore collection
    const colRef = collection(db, "entries");
  
    // Build the query
    let q = query(colRef, orderBy("entryDate", "asc"), limit(pageSize));
  
    // If it's not the first page, use `startAfter` with the last visible document
    if (lastVisible && page > 1) {
      q = query(colRef, orderBy("entryDate", "asc"), startAfter(lastVisible), limit(pageSize));
    }
  
    // Execute the query
    const querySnapshot = await getDocs(q);
  
    // Check if there are entries
    if (!querySnapshot.empty) {
      // Update the last visible document for the next page
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
  
      // Select the container element where the entries will be displayed
      const container = document.getElementById("entriesarchive");
  
      // Clear the container for the current page
      container.innerHTML = "";
  
      // Loop through the entries and append them to the container
      querySnapshot.forEach((doc) => {
        const entry = doc.data();
        const entryHTML = `
          <div class="entry">
            <img src="${entry.image || "default-image.png"}" alt="Entry Image" style="max-width: 100%; height: auto;">
            <p>${entry.text || "No text available."}</p>
            <p><strong> ${entry.imageDate} </strong> </p>
          </div>
        `;
        container.innerHTML += entryHTML;
      });
  
      // Display page number
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
    } else {
      console.log("You are already on the first page.");
    }
  }
  window.prevPage = prevPage; // Expose the function globally
  

}












