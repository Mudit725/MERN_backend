const express = require('express');
const router = express.Router();


const User = require('../Models/UserSchema')
const Concert = require('../Models/ConcertSchema')
const Booking = require('../Models/BookingSchema')
const Screen = require('../Models/ScreenSchema')


const errorHandler = require('../Middlewares/errorMiddleware');
const authTokenHandler = require('../Middlewares/checkAuthToken');
const adminTokenHandler = require('../Middlewares/checkAdminToken');


function createResponse(ok, message, data) {
    return {
        ok,
        message,
        data,
    };
}

router.get('/test', async (req, res) => {
    res.json({
        message: "Concert api is working"
    })
})


// admin access
router.post('/createconcert', adminTokenHandler, async (req, res, next) => {
    try {
        const { title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration } = req.body;

        const newConcert = new Concert({ title, description, portraitImgUrl, landscapeImgUrl, rating, genre, duration })
        await newConcert.save();
        res.status(201).json({
            ok: true,
            message: "Concert added successfully"
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/addcelebtoconcert', adminTokenHandler, async (req, res, next) => {
    try {
        const { concertId, celebType, celebName, celebRole, celebImage } = req.body;
        const concert = await Concert.findById(concertId);
        if (!concert) {
            return res.status(404).json({
                ok: false,
                message: "Concert not found"
            });
        }
        const newCeleb = {
            celebType,
            celebName,
            celebRole,
            celebImage
        };
        if (celebType === "cast") {
            concert.cast.push(newCeleb);
        } else {
            concert.crew.push(newCeleb);
        }
        await concert.save();

        res.status(201).json({
            ok: true,
            message: "Celeb added successfully"
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/createscreen', adminTokenHandler, async (req, res, next) => {
    try {
        const { name, location, seats, city, screenType } = req.body;
        const newScreen = new Screen({
            name,
            location,
            seats,
            city: city.toLowerCase(),
            screenType,
            concertSchedules: []
        });

        await newScreen.save();


        res.status(201).json({
            ok: true,
            message: "Screen added successfully"
        });
    }
    catch (err) {
        console.log(err);
        next(err); // Pass any errors to the error handling middleware
    }
})
router.post('/addconcertscheduletoscreen', adminTokenHandler, async (req, res, next) => {
    console.log("Inside addconcertscheduletoscreen")
    try {
        const { screenId, concertId, showTime, showDate } = req.body;
        const screen = await Screen.findById(screenId);
        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Screen not found"
            });
        }

        const concert = await Concert.findById(concertId);
        if (!concert) {
            return res.status(404).json({
                ok: false,
                message: "Concert not found"
            });
        }

        screen.concertSchedules.push({
            concertId,
            showTime,
            notavailableseats: [],
            showDate
        });

        await screen.save();

        res.status(201).json({
            ok: true,
            message: "Concert schedule added successfully"
        });

    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})


// user access
router.post('/bookticket', authTokenHandler, async (req, res, next) => {
    try {
        const { showTime, showDate, concertId, screenId, seats, totalPrice, paymentId, paymentType } = req.body;
        console.log(req.body);

        // You can create a function to verify payment id

        const screen = await Screen.findById(screenId);

        if (!screen) {
            return res.status(404).json({
                ok: false,
                message: "Theatre not found"
            });
        }



        const concertSchedule = screen.concertSchedules.find(schedule => {
            console.log(schedule);
            let showDate1 = new Date(schedule.showDate);
            let showDate2 = new Date(showDate);
            if (showDate1.getDay() === showDate2.getDay() &&
                showDate1.getMonth() === showDate2.getMonth() &&
                showDate1.getFullYear() === showDate2.getFullYear() &&
                schedule.showTime === showTime &&
                schedule.concertId == concertId) {
                return true;
            }
            return false;
        });

        if (!concertSchedule) {
            return res.status(404).json({
                ok: false,
                message: "Concert schedule not found"
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "User not found"
            });
        }
        console.log('before newBooking done');
        const newBooking = new Booking({ userId: req.userId, showTime, showDate, concertId, screenId, seats, totalPrice, paymentId, paymentType })
        await newBooking.save();
        console.log('newBooking done');



        concertSchedule.notAvailableSeats.push(...seats);
        await screen.save();
        console.log('screen saved');

        user.bookings.push(newBooking._id);
        await user.save();
        console.log('user saved');
        res.status(201).json({
            ok: true,
            message: "Booking successful"
        });

    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})


router.get('/concerts', async (req, res, next) => {
    try {
        const concerts = await Concert.find();

        // Return the list of concerts as JSON response
        res.status(200).json({
            ok: true,
            data: concerts,
            message: 'Concerts retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.get('/concerts/:id', async (req, res, next) => {
    try {
        const concertId = req.params.id;
        const concert = await Concert.findById(concertId);
        if (!concert) {
            // If the concert is not found, return a 404 Not Found response
            return res.status(404).json({
                ok: false,
                message: 'Concert not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: concert,
            message: 'Concert retrieved successfully'
        });
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})
router.get('/screensbycity/:city', async (req, res, next) => {
    const city = req.params.city.toLowerCase();

    try {
        const screens = await Screen.find({ city });
        if (!screens || screens.length === 0) {
            return res.status(404).json(createResponse(false, 'No screens found in the specified city', null));
        }

        res.status(200).json(createResponse(true, 'Screens retrieved successfully', screens));
    }
    catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
});
router.get('/screensbyconcertschedule/:city/:date/:concertid', async (req, res, next) => {
    try {
        const city = req.params.city.toLowerCase();
        const date = req.params.date;
        const concertId = req.params.concertid;

        // Retrieve screens for the specified city
        const screens = await Screen.find({ city });

        // Check if screens were found
        if (!screens || screens.length === 0) {
            return res.status(404).json(createResponse(false, 'No screens found in the specified city', null));
        }


        let temp = []
        // Filter screens based on the showDate
        const filteredScreens = screens.forEach(screen => {
            // screen 

            screen.concertSchedules.forEach(schedule => {
                let showDate = new Date(schedule.showDate);
                let bodyDate = new Date(date);
                // console.log(showDate , bodyDate);
                if (showDate.getDay() === bodyDate.getDay() &&
                    showDate.getMonth() === bodyDate.getMonth() &&
                    showDate.getFullYear() === bodyDate.getFullYear() &&
                    schedule.concertId == concertId) {
                    temp.push(
                        screen
                    );
                }
            })
        }
        );

        console.log(temp);

        res.status(200).json(createResponse(true, 'Screens retrieved successfully', temp));

    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
});

router.get('/schedulebyconcert/:screenid/:date/:concertid', async (req, res, next) => {
    const screenId = req.params.screenid;
    const date = req.params.date;
    const concertId = req.params.concertid;

    const screen = await Screen.findById(screenId);

    if (!screen) {
        return res.status(404).json(createResponse(false, 'Screen not found', null));
    }

    const concertSchedules = screen.concertSchedules.filter(schedule => {
        let showDate = new Date(schedule.showDate);
        let bodyDate = new Date(date);
        if (showDate.getDay() === bodyDate.getDay() &&
            showDate.getMonth() === bodyDate.getMonth() &&
            showDate.getFullYear() === bodyDate.getFullYear() &&
            schedule.concertId == concertId) {
            return true;
        }
        return false;
    });
    console.log(concertSchedules)

    if (!concertSchedules) {
        return res.status(404).json(createResponse(false, 'Concert schedule not found', null));
    }

    res.status(200).json(createResponse(true, 'Concert schedule retrieved successfully', {
        screen,
        concertSchedulesforDate: concertSchedules
    }));

});


router.get('/getuserbookings' , authTokenHandler , async (req , res , next) => {
    try {
        const user = await User.findById(req.userId).populate('bookings');
        if(!user){
            return res.status(404).json(createResponse(false, 'User not found', null));
        }

        let bookings = [];
        // user.bookings.forEach(async booking => {
        //     let bookingobj = await Booking.findById(booking._id);
        //     bookings.push(bookingobj);
        // })

        for(let i = 0 ; i < user.bookings.length ; i++){
            let bookingobj = await Booking.findById(user.bookings[i]._id);
            bookings.push(bookingobj);
        }

        res.status(200).json(createResponse(true, 'User bookings retrieved successfully', bookings));
        // res.status(200).json(createResponse(true, 'User bookings retrieved successfully', user.bookings));
    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})

router.get('/getuserbookings/:id' , authTokenHandler , async (req , res , next) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if(!booking){
            return res.status(404).json(createResponse(false, 'Booking not found', null));
        }

        res.status(200).json(createResponse(true, 'Booking retrieved successfully', booking));
    } catch (err) {
        next(err); // Pass any errors to the error handling middleware
    }
})



router.use(errorHandler)

module.exports = router;
