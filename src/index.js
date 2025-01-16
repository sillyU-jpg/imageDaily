import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs,
  addDoc } from 'firebase/firestore'
  import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes, getStorage,
  ref
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
//gets all docs from c ollection 

function getDate() {
  const date = new Date();
  const time = new Date();
  return date.toLocaleDateString() + " " + time.getHours() + ":" + time.getUTCMinutes() + time.get;
}

getDocs(colRef)
.then((snapshot) => {
  let entries = []
  snapshot.docs.forEach((doc) => {
    entries.push({ ...doc.data(), id: doc.id })
  })
  console.log(entries)
  })
  .catch(err => {
    console.log(err.message)
  })


 


  const addEntry = document.querySelector(".addEntry");
  let imageRef = addEntry.image.files[0]
   storageRef = ref(storage, imageRef)
  

  addEntry.addEventListener('submit', async (e) => {
      e.preventDefault()

              // Add entry to Firestore with the image URL
            addDoc(colRef, {
                  entryDate: getDate(), // function that gets the current date
                  image: imageRef, // Store the image URL
                  imageDate: addEntry.imageDate.value,
                  title: addEntry.title.value
              })
            
            })


  //deleting entries
  const deleteEntry = document.querySelector(".delete")
  deleteEntry.addEventListener('submit', (e) => {
    e.preventDefault()
  })

