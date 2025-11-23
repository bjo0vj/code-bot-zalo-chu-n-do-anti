module.exports.config = {
    name: "debuggroup",
    version: "1.0.0",
    role: 1,
    author: "TDF-2803",
    description: "Debug group info",
    category: "System",
    usage: "/debuggroup",
    cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
    const { threadId, type } = event;
    try {
        const groupInfo = await api.getGroupInfo(threadId);
        const details = groupInfo.gridInfoMap?.[threadId] || {};

        const keys = Object.keys(details);
        const msg = `Keys: ${keys.join(", ")}\n\nSample: ${JSON.stringify(details).substring(0, 1000)}`;

        return api.sendMessage(msg, threadId, type);
    } catch (e) {
        return api.sendMessage(`Error: ${e.message}`, threadId, type);
    }
};
