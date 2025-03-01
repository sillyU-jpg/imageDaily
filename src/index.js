import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, limit, orderBy, query, onSnapshot, where, doc, updateDoc, serverTimestamp, startAfter, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes, getStorage, ref } from "firebase/storage";
import { createUserWithEmailAndPassword, getAuth, signOut, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvYf2-mdKC_TsoI7fpoVK5B0C4CeRJuis",
  authDomain: "imagediarynk.firebaseapp.com",
  projectId: "imagediarynk",
  storageBucket: "imagediarynk.firebasestorage.app",
  messagingSenderId: "185040970597",
  appId: "1:185040970597:web:fc191de4a14ceec828f78c",
  measurementId: "G-1JW7YWPW2F"
};

initializeApp(firebaseConfig);
const db = getFirestore();
const colRef = collection(db, 'entries');
const auth = getAuth();
const storage = getStorage();
let loggedIn;

const currentPage = document.body.getAttribute("data-page");

if (currentPage === "index") {
  async function getLatestEntry() {
    const q = query(colRef, orderBy("entryDate", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const latestEntry = querySnapshot.docs[0].data();
      const todayEntryElement = document.getElementById("todayentry");
      const entryHTML = `
        <img src="${latestEntry.image}" alt="Entry Image" style="max-width: 100%; height: auto;">
        <p>${latestEntry.text}</p>
        <p><strong>${latestEntry.imageDate}</strong></p>
      `;
      todayEntryElement.innerHTML = entryHTML;

      const docRef = doc(db, 'entries', querySnapshot.docs[0].id);
      await updateDoc(docRef, { displayedOnDaily: true });
    } else {
      document.getElementById("todayentry").innerHTML = "<p>No entries found. This must be an error...</p>";
    }
  }

  getLatestEntry();
} else if (currentPage === "archive") {
  let lastVisible = null;
  let currentPage = 1;
  const pageSize = 6;

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

  displayEntries();

  function nextPage() {
    currentPage += 1;
    displayEntries(currentPage);
  }
  window.nextPage = nextPage;

  function prevPage() {
    if (currentPage > 1) {
      currentPage -= 1;
      displayEntries(currentPage);
    }
  }
  window.prevPage = prevPage;
}

if (currentPage === "login") {
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
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.assign("login.html");
    } else {
      console.log("User is logged in");

      async function uploadImage() {
        const file = document.getElementById("image-file").files[0];
        const storageRef = ref(storage, `entryImages/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        console.log("Image successfully uploaded");
        return getDownloadURL(uploadResult.ref);
      }

      const addEntry = document.querySelector(".addEntry");
      addEntry.addEventListener("submit", async (e) => {
        e.preventDefault();

        const imageUrl = await uploadImage();

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
