import prisma from "../db/db.config.js";

export const registerUser = async (req, res) => {
  const { enrollment, name, email, password, phone, gender, batch } = req.body;

  console.log("Register Request Body: ", req.body);

  try {
    const findUser = await prisma.user.findUnique({
      where: {
        enrollment: enrollment,
      },
    });

    if (findUser) {
      return res.json({
        status: 409,
        message: "You are already registered with the portal!!",
      });
    }

    const newUser = await prisma.user.create({
      data: {
        enrollment,
        name: name,
        email: email,
        password: password,
        phone,
        gender,
        batch,
      },
    });
    return res.json({
      status: 200,
      message: "Student created successfully!!",
      data: newUser,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUsers = async (req, res) => {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 15;

    if (page <= 0) {
      page = 1;
    }
    if (limit <= 0 || limit > 20) {
      limit = 10;
    }
    const offset = (page - 1) * limit;
    const users = await prisma.user.findMany({
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        enrollment: true,
        phone: true,
        gender: true,
        batch: true,
      },
    });

    // get current user count
    const tCount = await prisma.user.count();
    const totalPages = Math.ceil(tCount / limit);
    return res.json({
      status: 200,
      students: users.length,
      data: users,
      meta: {
        totalPages,
        currentPage: page,
        limit: limit,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserStatus = async (req, res) => {
  const { enrollment } = req.params;
  console.log(enrollment);

  try {
    // Find user by enrollment
    const user = await prisma.user.findUnique({
      where: {
        enrollment: enrollment,
      },
      include: {
        logs: {
          orderBy: {
            timeIn: "desc",
          },
        },
      },
    });

    console.log(user);

    if (!user) {
      return res.json({
        status: 404,
        message: "User not found!",
      });
    }

    // Use the user_status field from the database
    const userStatus = user.user_status;

    // Get the most recent log entry for additional context
    const latestLog = user.logs && user.logs.length > 0 ? user.logs[0] : null;

    return res.json({
      status: 200,
      message: "User status retrieved successfully!",
      data: {
        enrollment: user.enrollment,
        name: user.name,
        user_status: userStatus, // 0 = inside, 1 = outside
        lastActivity: latestLog ? {
          timeIn: latestLog.timeIn,
          timeOut: latestLog.timeOut,
          purpose: latestLog.purpose
        } : null
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: "Internal server error!",
    });
  }
};

export const setUserStatus = async (req, res) => {
  const { enrollment } = req.params;
  const { purpose } = req.body; // Optional purpose for the log entry

  try {
    // Find user by enrollment
    const user = await prisma.user.findUnique({
      where: {
        enrollment: enrollment,
      },
      include: {
        logs: {
          orderBy: {
            timeIn: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.json({
        status: 404,
        message: "User not found!",
      });
    }

    // Determine current status based on latest log
    let currentStatus;
    let latestLog = null;

    if (!user.logs || user.logs.length === 0) {
      // No logs = outside campus
      currentStatus = 1;
    } else {
      latestLog = user.logs[0];
      // Check if timeIn exists and timeOut is null = inside campus
      // If timeIn exists and timeOut exists = outside campus
      if (latestLog.timeIn && latestLog.timeOut === null) {
        currentStatus = 0; // Inside campus
      } else {
        currentStatus = 1; // Outside campus
      }
    }

    let newStatus;
    let logEntry;

    if (currentStatus === 0) {
      // User is currently inside campus, so they're leaving
      // Update the latest log with timeOut and update user_status
      if (latestLog) {
        logEntry = await prisma.status.update({
          where: {
            id: latestLog.id,
          },
          data: {
            timeOut: new Date(),
          },
        });
      }
      
      // Update user status to 1 (outside)
      await prisma.user.update({
        where: { id: user.id },
        data: { user_status: 1 }
      });
      
      newStatus = 1; // Now outside campus
    } else {
      // User is currently outside campus, so they're entering
      // Create a new log entry with timeIn only and update user_status
      logEntry = await prisma.status.create({
        data: {
          timeIn: new Date(),
          purpose: purpose || null,
          userId: user.id,
        },
      });
      
      // Update user status to 0 (inside)
      await prisma.user.update({
        where: { id: user.id },
        data: { user_status: 0 }
      });
      
      newStatus = 0; // Now inside campus
    }

    return res.json({
      status: 200,
      message: `User ${newStatus === 0 ? 'entered' : 'left'} campus successfully!`,
      data: {
        enrollment: user.enrollment,
        name: user.name,
        user_status: newStatus, // 0 = inside, 1 = outside
        logEntry: {
          id: logEntry.id,
          timeIn: logEntry.timeIn,
          timeOut: logEntry.timeOut,
          purpose: logEntry.purpose,
        },
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: "Internal server error!",
    });
  }
};

export const getUser = async (req, res) => {
  const { enrollment } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: {
        enrollment: Number(enrollment),
      },
      select: {
        id: true,
        name: true,
        enrollment: true,
        email: true,
        phone: true,
        gender: true,
        batch: true,
      },
      include: {
        logs: true,
      },
    });

    if (!user) {
      return res.json({ status: 404, message: "User not found!!" });
    }
    return res.json({
      status: 200,
      message: "User fetched successfully!!",
      data: user,
    });
  } catch (error) {
    console.log(error);
  }
};

export const loginUser = async (req, res) => {
  const { enrollment, password } = req.body;

  try {
    // Find user by enrollment number
    const user = await prisma.user.findUnique({
      where: {
        enrollment: enrollment,
      },
    });

    if (!user) {
      return res.json({
        status: 404,
        message: "User not found with this enrollment number!",
      });
    }

    // Check password (no hashing as requested for hackathon)
    if (user.password !== password) {
      return res.json({
        status: 401,
        message: "Invalid password!",
      });
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      status: 200,
      message: "Login successful!",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: 500,
      message: "Internal server error!",
    });
  }
};
