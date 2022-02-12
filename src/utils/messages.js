export const generateMessage = (username, text) => {
  return {
    text,
    username
    //createdAt: new Date().getTime()
  }
}

export const generateLocationMessage = (username, url) => {
  return {
    url,
    username,
    createdAt: new Date().getTime()
  }
}