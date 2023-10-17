const User = require('../models/User')
const Note = require('../models/Note')
//const asyncHandler = require('express-async-handler')

// @desc Get all notes
// @route Get /notes
// @access Private
// const getAllNotes = asyncHandler(async (req,res)=>{ //Before refac
const getAllNotes = async (req,res)=>{
    const notes = await Note.find().lean()

    if(!notes?.length){
        return res.status(400).json({ message: 'No notes found'})
    }

    const notesWithUser = await Promise.all(notes.map(async(note)=>{
        const user = await User.findById(note.user).lean().exec()
        return{...note, username: user.username}
    }))

    res.json(notesWithUser)
}

// @desc Create new note
// @route POST /notes
// @access Private
const createNewNote = async (req,res)=>{
    const {user, title, text} = req.body

    // Confirm fields required
    if(!user || !title || !text){
        return res.status(400).json({ message: 'Insuficient given data, All fields required'})
    }
/*
    // Check if user exist
    const username_db = await User.findOne({user}).lean().exec()
    if(!username_db){
        return res.status(409).json({ message: "Username doesn't exist"})
    }
*/

    // Check for duplicate title
    const duplicate = await Note.findOne({title}).collation({ 
        locale: 'en', strength: 2 }).lean().exec()
    if(duplicate){
        return res.status(409).json({ message: 'Duplicate note title'})
    }

    // Create and store the new user
    const note = await Note.create({user, title, text})
    if(note){
        return res.status(201).json({ message: 'New note created'})
    } else {
        return res.status(400).json({ message: 'Invalid note data received'})
    }
}

// @desc Update one note
// @route PATCH /notes
// @access Private
const updateNote = async (req,res)=>{
    const {id, user, title, text, completed} = req.body

    // Check fields
    if(!id || !user || !title || !text){
        return res.status(400).json({ message: 'All fields are required'})
    }
/*
    if(!completed){
        return res.status(400).json({ message: 'Boolean fields is required'})
    }
*/
    if(typeof completed !== 'boolean'){
        return res.status(400).json({ message: 'Boolean value is required'})
    }

    // Check if title exist
    const note = await Note.findById(id).exec()
    if(!note){
        return res.status(400).json({ message: 'Note not found' })
    }
    /*
    // Check if user exist
    const username_db = await Note.findOne({user}).lean().exec()
    if(!username_db){
        return res.status(409).json({ message: "Username doesn't exist"})
    }
    */
    // Check for duplicate title and note exist to update
    const duplicate = await Note.findOne({title}).collation({ 
        locale: 'en', strength: 2 }).lean().exec()
    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({ message: 'Duplicate note title'})
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updateNote = await note.save()

    res.json(`'${updateNote.title}' updated`)
}

// @desc Delete one note
// @route DELETE /note
// @access Private
const deleteNote = async (req,res)=>{
    const { id } = req.body
    
    // Confirm data
    if(!id){
        return res.status(400).json({ message: 'Id required'})
    }

    // Confirm note exists to delete
    const note = await Note.findById(id).exec()
    if (!note){
        return res.status(400).json({ message: 'Note not found'})
    }

    const result = await note.deleteOne()

    const reply = `Note '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllNotes,
    createNewNote,
    updateNote,
    deleteNote
}