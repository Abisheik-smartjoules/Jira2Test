// Simple test to understand assumption parsing
const testAssumption = "! ";
console.log("Original assumption:", JSON.stringify(testAssumption));

// Simulate formatter output
const formattedLine = `  # ASSUMPTION: ${testAssumption}`;
console.log("Formatted line:", JSON.stringify(formattedLine));

// Simulate parser logic
const trimmedLine = formattedLine.trim();
console.log("Trimmed line:", JSON.stringify(trimmedLine));

const comment = trimmedLine.substring(1); // Remove #
console.log("Comment after removing #:", JSON.stringify(comment));

const cleanComment = comment.startsWith(' ') ? comment.substring(1) : comment;
console.log("Clean comment:", JSON.stringify(cleanComment));

if (cleanComment.startsWith('ASSUMPTION:')) {
  const assumptionText = cleanComment.startsWith('ASSUMPTION: ') 
    ? cleanComment.substring(12) 
    : cleanComment.substring(11);
  console.log("Parsed assumption:", JSON.stringify(assumptionText));
  console.log("Match:", testAssumption === assumptionText);
}