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

router.post('/vote/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    const candidateID = req.params.candidateID
    const userID = req.user.id
    try {
        const candidate = await Candidate.findById(candidateID)
        if(!candidate){
            return res.status(404).json({error:"Candidate not found"})
       }
        const user = await User.findById(userID)
        if(!user){
            return res.status(404).json({error:"User not found"})
       }
       if(user.isvoted){
            return res.status(400).json({error:"User already Voted"})
       }
       if(user.role == 'admin'){
            return res.status(403).json({error:"Admin is not allowed to vote"})
       }

       candidate.votes.push({user:userID})
       candidate.voteCount++
       await candidate.save()

       user.isvoted = true
       await user.save()
       res.status(200).json({message:"Voted Successfully"})
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get('/result',async(req,res)=>{
    try {
        const candidate = await Candidate.find().sort({voteCount:'descending'})
        const voteRecord = candidate.map((data)=>{
            return{
                party:data.party,
                count:data.voteCount
            }
        })
        res.status(200).json(voteRecord);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.get('/list',async(req,res)=>{
    try {
        const candidate = await Candidate.find()
        const candidateList = candidate.map((data)=>{
            return{
                name:data.name,
                party:data.party
            }
        })
        res.status(200).json(candidateList);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

module.exports = router;