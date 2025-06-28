const express = require('express');
const router = express.Router();
const User = require('../models/user')
const {jwtAuthMiddleware, generateToken} = require('../jwt');
const Candidate = require('./../models/candidate');

const checkAdmin = async(userID)=>{
    try{
        const user = await User.findById(userID)
        if(user.role === 'admin'){
            return true
        }
    }catch(err){
        return false
    }
}

router.post('/', jwtAuthMiddleware,async (req, res) =>{
    try{
        if (!await checkAdmin(req.user.id))
            return res.status (403).json({message: 'user has not admin role'});
        const data = req.body
        const newCandidate = new Candidate(data);
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.put('/:candidateID',jwtAuthMiddleware,async (req,res)=>{
    try{
        if (!checkAdmin(req.user.id))
            return res.status (403).json({message: 'user has not admin role'});

        const candidateID = req.params.candidateID;
        const updateCandidateData = req.body

       const response = await Candidate.findByIdAndUpdate(candidateID,updateCandidateData,{
        new: true,
        runValidators: true
       })

       if(!response){
            return res.status(404).json({error:"Candidate not found"})
       }

        console.log('Candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', jwtAuthMiddleware,async (req, res)=>{
    try{
        if (!checkAdmin(req.user.id))
            return res.status (403).json({message: 'user has not admin role'});

        const candidateID = req.params.candidateID;
       const response = await Candidate.findByIdAndDelete(candidateID)

       if(!response){
            return res.status(404).json({error:"Candidate not found"})
       }
        console.log('Candidate deleted');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

module.exports = router;