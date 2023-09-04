//Array to store the Socket.Id of all existing users
const users = [];

/*
 * Adds new user to user array above
 *
 * @param {String} id Socket.Id of newly added user
 * 
 * @param {String} name username of newly added user
 * 
 * @param {String} room unique room id joined by new user
 * 
 */
const addUser = ({ id, name, room }) => {
  name = name.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if(!room) return { error: 'Room are required.' };

  const user = { id, name, room };

  users.push(user);

  return { user };
}

/*
 * Removes existing user from user array above
 *
 * @param {String} id Socket.Id of user to be removed
 * 
 */
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if(index !== -1) return users.splice(index, 1)[0];
}

/*
 * Gets user object from user array above using a socket.id
 *
 * @param {String} id Socket.Id of user to be returned
 * 
 */
const getUser = (id) => users.find((user) => user.id === id);

/*
 * Gets all users in user array that belongs to a specific room
 *
 * @param {String} room Room ID used to identify users to return
 * 
 */
const getUsersInRoom = (room) => users.filter((user) => user.room === room);

module.exports = { addUser, removeUser, getUser, getUsersInRoom };