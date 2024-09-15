document.getElementById('worksheetForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form from submitting normally

    // Gather form data
    const formData = new FormData(this);
    const selectedStudents = formData.getAll('students'); // Fetch all selected students
    const selectedTopic = formData.get('topic'); // Fetch the selected topic
    const numberOfQuestions = formData.get('questions'); // Fetch the number of questions

    // Show loading text
    document.getElementById('loading').style.display = 'block';
    document.getElementById('downloadBtn').style.display = 'none'; // Hide download button initially

    // Loop over selected students to generate questions for each
    selectedStudents.forEach(async (studentId) => {
        try {
            const response = await fetch('/generate-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: studentId, // Pass student ID
                    topic: selectedTopic, // Pass selected topic
                    numberOfQuestions: numberOfQuestions, // Pass the number of questions
                }),
            });

            if (response.ok) {
                const data = await response.json();

                function loadFile(url, callback) {
                    PizZipUtils.getBinaryContent(url, callback);
                }
              
                const template = "docxtemplates/Template.docx";

                loadFile(template, async function (error, content) {
                    if (error) {
                        throw error;
                    }

                    const zip = new PizZip(content);
                    const doc = new window.docxtemplater(zip, {
                        paragraphLoop: true,
                        linebreaks: true,
                    });

                    // Prepare the data for the template
                    doc.setData({
                        topic: selectedTopic,
                        name: data.studentName, // Use studentName from the response
                        questionsData: data.questions.map((question, index) => ({
                            numberofquestion: `question ${index + 1}`, // Fixed number formatting
                            question: question, // Corrected from question[index] to question
                        })),
                    });

                    try {
                        // Render the document
                        doc.render();
                    } catch (error) {
                        // Handle rendering errors
                        const e = {
                            message: error.message,
                            name: error.name,
                            stack: error.stack,
                            properties: error.properties,
                        };
                        console.log(JSON.stringify({ error: e }));
                        throw error;
                    }

                    const generatedDocDownload = doc.getZip().generate({
                        type: "blob",
                        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        compression: "DEFLATE",
                    });

                    // Hide loading text and show download button
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('downloadBtn').style.display = 'block';
                    
                    // Set up the download button click event
                    document.getElementById('downloadBtn').addEventListener('click', () => {
                        saveAs(generatedDocDownload, `${data.studentName}_Worksheet.docx`);
                    });
                });
            } else {
                alert('Failed to generate questions.');
                document.getElementById('loading').style.display = 'none'; // Hide loading text if failed
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating the questions.');
            document.getElementById('loading').style.display = 'none'; // Hide loading text if error occurs
        }
    });
});
