/**
 * Basic UUIDv4 generator.
 * 
 * @returns {string}
 */
module.exports = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16 | 0;
    let digit = rand;
    if (char !== 'x') {
        digit = rand & 0x3 | 0x8;
    }

    return digit.toString(16);
});