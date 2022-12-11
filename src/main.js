// Imports From Tuari Api
const {
   invoke
} = window.__TAURI__.tauri
const {
   appWindow
} = window.__TAURI__.window
const {
   open
} = window.__TAURI__.dialog
const {
   readDir
} = window.__TAURI__.fs


// Create selector 
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)


// Title Bar Butons
$('.close').addEventListener('click', () => appWindow.close())
$('.minimize').addEventListener('click', () => appWindow.toggleMaximize())
$('.maximize').addEventListener('click', () => appWindow.minimize())



// Dynamic title 
$('#title').textContent = document.title

// Open File Dyalog 
$('#openFileBtn').onclick = openFolder


// Open New Folder 
$("#openNewFileBtn").onclick = openNewFolder


// Return to Past directory
$('#returnDir').onclick = returnPastDirectory





// Open Directory 
async function openFolder() {

   const path = await open({
      directory: true
   })

   if (!path) {
      $("#informMe").click()
      return
   }
   // Remove White Space 
   $('.container').style.height = "0"
   $('.left-arrow').classList.remove('p-btn-disabled')

   // Set directory to main Div ()
   $('.browsing').setAttribute('data-dir', path)

   readDirctory()






}

// Open New Folder
function openNewFolder() {
   location.reload()
}


//Read Directory 
async function readDirctory() {
   // Cleaning surface 
   $('.open-file').classList.add('hide')
   $('.explorer').classList.remove('hide')
   $('.browsing').innerHTML = ''



   const entries = await readDir($('.browsing').getAttribute('data-dir'))

   // Append Size of Files & Folders
   const entriesWithSize = entries.map(e => [
      e.name,
      e.path,
      "0",
      e.children ? true : false
   ])

   // Call Backend and send data to him 
   invoke('get_info', {
         entries: entriesWithSize
      })
      .then((response) => {
         if ($('.browsing').hasChildNodes()) {
            $('.browsing').innerHTML = ''
         }

         //Sort Array Folder -> File
         response.sort((resA,resB)=> Number(resB.is_folder) - Number(resA.is_folder))
         
         // Show all files & folders from backend
         response.forEach(res => {

            // <a>
            let a = document.createElement('a')
            a.setAttribute('class', 'file-decoration')
            a.setAttribute('title', `${(res.size/1024).toFixed(3)}KB`)
            a.setAttribute('data-path', `${res.path}`)
            a.setAttribute('data-folder', `${ res.is_folder}`)

            // <img>
            let img = document.createElement('img')
            img.setAttribute('width', '80')
            img.setAttribute('src', `${ res.is_folder ? 
               "./assets/folder.png":
               "./assets/file.png"
            }`)

            // <h2>
            let h2 = document.createElement('h2')
            h2.setAttribute('spellcheck', 'false')
            h2.setAttribute('class', 'p-headline')
            h2.innerText = res.name

            /*
               a
               |-img
               |-h2
            */

            a.appendChild(img)
            a.appendChild(h2)

            //handling foles & folders
            a.onclick = filesAndfoldersHandler

            // Add list of fils & folders to dom 
            $('.browsing').appendChild(a)

         })

      })

}


//Return Past Directory
async function returnPastDirectory() {
   // get Directory path
   let path = $('.browsing').getAttribute('data-dir')

   // Generate new Path (past)
   let arryPath = path.split("\\")
   arryPath.pop()
   let finalPath = ""
   arryPath.forEach((p, index) => {
      finalPath += (index === 0 ? "" : "\\") + p
   })

   //  Add to Perent Path 
   $('.browsing').setAttribute('data-dir', finalPath)

   $('#title').textContent = finalPath

   // Update DOM
   await readDirctory()


}


//Filse and Folders Handlers 
function filesAndfoldersHandler() {

   let foldersAndFiles = [...$$('.file-decoration')]

   //open Folder 
   openFolderFromDirectory(foldersAndFiles)

   //Rename Files & Folders
   renameFileAndFolder(foldersAndFiles)



   // Delete Folders & Files 
   deleteFileAndFolder(foldersAndFiles)












}


function openFolderFromDirectory(foldersAndFiles) {
   // Select Folders
   let folders = foldersAndFiles.filter(e =>
      e.getAttribute('data-folder') == "true"
   )

   folders.forEach(folder => {
      folder.addEventListener('dblclick', () => {
         const path = folder.getAttribute('data-path')
         $('.browsing').setAttribute('data-dir', path)

         readDirctory()

         $('#title').textContent = path

      })

   })


}




// Rename Files & Folders
function renameFileAndFolder(foldersAndFiles) {
   foldersAndFiles.forEach(ff => {
      // Make name of File & Folder EDITEABLE
      let h2 = ff.querySelector('a h2')

      h2.onclick = () => {
         h2.setAttribute("contenteditable", true)
      }
      let oldName = h2.textContent

      h2.addEventListener('keyup',  (e) => {

         // When Press Enter (save)
         if (e.isComposing || e.keyCode === 13) {
            e.preventDefault()

            // Remove White Space & New Line 
            h2.innerText = h2.innerText.replace(/(\r\n|\n|\r)/gm, "")

            // Close Editing field
            h2.setAttribute("contenteditable", false)

            const newName = h2.innerText

            // Rename From Back End
            rename(
               ff.getAttribute('data-path'),
               ff.getAttribute('data-path').replace(oldName, newName),
            )

            readDirctory()

         }
      })



   })

}
// Delete File & Folders 
function deleteFileAndFolder(foldersAndFiles) {

   // Use Tradetion For loop (fast) 
   for (let index = 0; index < foldersAndFiles.length; index++) {
      const fileAndFolder = foldersAndFiles[index]
      // Click folder & regester him 
      fileAndFolder.onclick = (e) => {
         e.preventDefault()

         $('.browsing').setAttribute('remove-path', fileAndFolder.getAttribute('data-path'))

         $('.browsing').setAttribute('remove-isfolder', fileAndFolder.getAttribute('data-folder'))

      }

   }

}


// Renaming Files & Folders
function rename(oldName, newName) {

   invoke('rename_files', {
      oldPath: oldName,
      newName: newName
   })

}


// Delete when Press in Keyboard
document.addEventListener('keyup', async (e) => {
   // event here is Delete (press)
   if (e.isComposing || e.keyCode === 46) {

      remove(
         $('.browsing').getAttribute('remove-path'),
         $('.browsing').getAttribute('remove-isfolder') == 'true' ? true : false)
   }
})






function remove(path, isFolder) {
   if (!path)  return

   invoke('remove_files', {
      path: path,
      isFolder: isFolder
   })
   $('.browsing').setAttribute('remove-path', "")
   $('.browsing').setAttribute('remove-isfolder', "")


   readDirctory()



}