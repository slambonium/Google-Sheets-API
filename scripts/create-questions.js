/* a question:

  {
    "quizType":"",
    "difficulty":"",
    "question":"",
    "example":"exampletext",
    "answers":[
      ["answertext",false],
      ["answertext",false],
      ["answertext",false],
      ["answertext",false]
    ],
    "refs":[
      ["refname","url"],
      ["refname","url"],
      ["refname","url"]
    ]
  }

*/

/* http://spreadsheets.google.com/tq?tq=select A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q&key=1JkjprTYraBqUW-h9GWv817oUNML2oQN1oGzcRwMTRvo */

var thisQuery = 'select A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q';
var spreadsheetId = '1JkjprTYraBqUW-h9GWv817oUNML2oQN1oGzcRwMTRvo';
var quizQuestions = [];
var currentCellIndex;

$(document).ready(function() {

  var getQuestionsFromGoogleDriveSpreadsheet = function(thisQuery, spreadsheetId) {
  
  // the parameters we need to pass in our request
  var request = {tq: thisQuery,
                key: spreadsheetId,
                };
  
  var result = $.ajax({
    /* http://api.jquery.com/jQuery.ajax/ */

    // url: "http://spreadsheets.google.com/tq",
    // data: request,
    // url: 'http://spreadsheets.google.com/tq?tq=' + thisQuery + '&key=' + spreadsheetId,
    url: 'https://spreadsheets.google.com/feeds/cells/1JkjprTYraBqUW-h9GWv817oUNML2oQN1oGzcRwMTRvo/od6/public/full?alt=json',
    dataType: "jsonp",
    /* http://bob.ippoli.to/archives/2005/12/05/remote-json-jsonp/ */
    type: "GET",
    })
  .done(function(result){
    // var searchResults = showSearchResults(request.tagged, result.items.length);

    // $('.search-results').html(searchResults);

    // $.each(result.items, function(i, item) {
    //   var question = showQuestion(item);
    //   $('.results').append(question);
    // });
    console.log('Returned: ',result);
    parseResult(result);
  })
  .fail(function(jqXHR, error, errorThrown){
    // var errorElem = showError(error);
    // $('.search-results').append(errorElem);
    console.log('request failed');
  });

}; /* end function getQuestionsFromGoogleDriveSpreadsheet() */

function parseResult(requestObj) {
  console.log(requestObj);
  var isHeaderEntry = true;
  var numColumns = 0;
  var numRows = 0;
  /* count the number of header cells and therefore the number of possible columns of data */
  while (isHeaderEntry) {
    if (requestObj.feed.entry[numColumns].gs$cell.col.toString() === '1' && numColumns > 0) {
      isHeaderEntry = false;
    } else {
      numColumns ++;
    }
  }
  console.log('There are:', numColumns, 'columns in the spreadsheet.       ');
  /* we now know the number of columns in the spreadsheet here */
  /* find out how many data rows, i.e., excluding the header row, in spreadsheet so we can traverse properly */
  numRows = parseInt(requestObj.feed.entry[requestObj.feed.entry.length - 1].gs$cell.row);
  console.log('There are:', (numRows - 1), 'data rows in the spreadsheet.');

  /* setting currentCellIndex to the first cell after the header row */
  currentCellIndex = numColumns;
  for (var i=2; i<=numRows; i++) {
    /* requestObj.feed.entry is an array of non-empty spreadsheet cells information */
    quizQuestions.push(createQuestion3(i, numColumns, requestObj.feed.entry));
  }

  console.log(quizQuestions);

} /* end function parseResult() */

function createQuestion(row, columns, cellsArray) {
  var question = {};
  question.quizType = '"' + cellsArray[row*columns].gs$cell.inputValue + '"';
  question.difficulty = '"' + cellsArray[row*columns + 1].gs$cell.inputValue + '"';
  // question.question = '"' + cellsArray[row*columns + 2].gs$cell.inputValue + '"';
  question.question = '"' + replaceChars( cellsArray[row*columns + 2].gs$cell.inputValue ) + '"';
  // question.example = cellsArray[row*columns + 3].gs$cell.inputValue === '*' ? '""' : '"' + cellsArray[row*columns + 3].gs$cell.inputValue + '"';
  question.example = cellsArray[row*columns + 3].gs$cell.inputValue === '*' ? '""' : '"' + replaceChars( cellsArray[row*columns + 3].gs$cell.inputValue ) + '"';
  question.answers = [];
  for (var i=1; i<=8; i+=2) {
    if (cellsArray[row*columns + 3 + i].gs$cell.inputValue !== '*') {
      /* get the true/false value for this answer */
      var trueFalse = cellsArray[row*columns + 3 + i + 1].gs$cell.inputValue === 'TRUE' ? true:false;
      // var answer = [cellsArray[row*columns + 3 + i].gs$cell.inputValue, trueFalse];
      var answer = [ replaceChars( cellsArray[row*columns + 3 + i].gs$cell.inputValue ), trueFalse];
      question.answers.push(answer);
    }
  }
  question.refs = [];
  for (i=1; i<=6; i+=2) {
    // console.log('cellsArray['+(row*columns + 11 + i)+'].gs$cell.inputValue =',cellsArray[row*columns + 11 + i].gs$cell.inputValue);
    if (cellsArray[row*columns + 11 + i].gs$cell.inputValue !== '*') {
      var reference = [ '"' + cellsArray[row*columns + 11 + i].gs$cell.inputValue + '"', '"' + cellsArray[row*columns + 11 + i + 1].gs$cell.inputValue + '"' ];
      // console.log('Should be adding a reference:' + reference + 'here.');
      question.refs.push(reference);
    }   
  }
  return question;
  // console.log(question);
} /* end function createQuestion() */

function createQuestion2(row, columns, cellsArray) {
  /* row passed in is meant to be a data row; 
     row 1 of the actual spreadsheet is a header row */
  console.log('passed in row=',row,'; columns=', columns);
  var question = {};
  question.answers = [];
  question.refs = [];
  /* we expect, but need to test for, a number of entries per row 
     equal to columns */
  /* the Google Sheets API leaves out blank cells from the returned 
     request object but each cell is identified with its row and col */
  for (var i=columns; i<cellsArray.length; i++) {
    /* starting at i=columns because the first 
       row of the spreadsheet is a header row */
    // var thisCellsInfo = cellsArray[row*columns - 1 + i].gs$cell;
    var thisCellsInfo = cellsArray[i].gs$cell;
    var thisCellsValue = thisCellsInfo.inputValue;
    var thisCellsCol = parseInt(thisCellsInfo.col);
    console.log('on row', parseInt(thisCellsInfo.row), ', col', thisCellsCol, '; thisCellsInfo=', thisCellsInfo);   
    /* make sure we are reading a cell that is still on the current row */
    if (parseInt(thisCellsInfo.row) === row + 1) {
      /* if here, then we are on the same row still as the argument row, 
         and so still acquiring data for the question on that row of the 
         spreadsheet */
      if (thisCellsCol === 1) {
        question.quizType = '"' + thisCellsValue + '"';
      } else if (thisCellsCol === 2) {
          question.difficulty = '"' + thisCellsValue + '"';
      } else if (thisCellsCol === 3) {
          question.question = '"' + replaceChars( thisCellsValue ) + '"';
      } else if (thisCellsCol === 4) {
          question.example = '"' + replaceChars( thisCellsValue ) + '"';
      } else if (thisCellsCol === 5 || thisCellsCol === 7 || thisCellsCol === 9 || thisCellsCol === 11) {
          /* this column position is for one possible answer */
          /* get the true/false value for this answer which is in the next column */
          var trueFalse = cellsArray[parseInt(thisCellsInfo.col) + 1].gs$cell.inputValue === 'TRUE' ? true:false;
          var answer = [ replaceChars( thisCellsValue ), trueFalse];
          question.answers.push(answer);
      } else if (thisCellsCol === 13 || thisCellsCol === 15 || thisCellsCol === 17) {
          /* the reference name should be in the current column, 
             and the reference url should be in the next column */
          var reference = [ '"' + replaceChars( thisCellsValue ) + '"', '"' + cellsArray[parseInt(thisCellsInfo.col) + 1].gs$cell.inputValue + '"' ];
          // console.log('Should be adding a reference:' + reference + 'here.');
          question.refs.push(reference);
      } /* end if (thisCellsCol === 1) */

    } else {
      // return question;
    } /* end if (parseInt(thisCellsInfo.row) === row) */

  } /* end for loop */

  return question;

} /* end function createQuestion2() */

function createQuestion3(row, columns, cellsArray) {
  /* row passed in is meant to be a data row; 
     row 1 of the actual spreadsheet is a header row */
  console.log('passed in row=',row,'; columns=', columns);
  var question = {};
  question.answers = [];
  question.refs = [];
  /* we expect, but need to test for, a number of entries per row 
     equal to columns */
  /* the Google Sheets API leaves out blank cells from the returned 
     request object but each cell is identified with its row and col */
  for (var i=currentCellIndex; i<cellsArray.length; i++) {
    /* starting at i=columns because the first 
       row of the spreadsheet is a header row */
    // var thisCellsInfo = cellsArray[row*columns - 1 + i].gs$cell;
    var thisCellsInfo = cellsArray[i].gs$cell;
    var thisCellsValue = thisCellsInfo.inputValue;
    var thisCellsCol = parseInt(thisCellsInfo.col);
    console.log('on row', parseInt(thisCellsInfo.row), ', col', thisCellsCol, '; thisCellsInfo=', thisCellsInfo);   
    /* make sure we are reading a cell that is still on the current row */
    if (parseInt(thisCellsInfo.row) === row) {      
      /* if here, then we are on the same row still as the argument row, 
         and so still acquiring data for the question on that row of the 
         spreadsheet */
      if (thisCellsCol === 1) {
        question.quizType = '"' + thisCellsValue + '"';
      } else if (thisCellsCol === 2) {
          question.difficulty = '"' + thisCellsValue + '"';
      } else if (thisCellsCol === 3) {
          question.question = '"' + replaceChars( thisCellsValue ) + '"';
      } else if (thisCellsCol === 4) {
          question.example = '"' + replaceChars( thisCellsValue ) + '"';
      } else if (thisCellsCol === 5 || thisCellsCol === 7 || thisCellsCol === 9 || thisCellsCol === 11) {
          /* this column position is for one possible answer */
          /* get the true/false value for this answer which is in the next column/cell */
          var trueFalse = cellsArray[currentCellIndex + 1].gs$cell.inputValue === 'TRUE' ? true:false;
          var answer = [ replaceChars( thisCellsValue ), trueFalse];
          question.answers.push(answer);
      } else if (thisCellsCol === 13 || thisCellsCol === 15 || thisCellsCol === 17) {
          /* the reference name should be in the current column, 
             and the reference url should be in the next column */
          var reference = [ '"' + replaceChars( thisCellsValue ) + '"', '"' + cellsArray[parseInt(thisCellsInfo.col) + 1].gs$cell.inputValue + '"' ];
          // console.log('Should be adding a reference:' + reference + 'here.');
          question.refs.push(reference);
      } /* end if (thisCellsCol === 1) */
      currentCellIndex ++;
    } else {
        /* we will get here when the cell's row is the next row; 
           therefore, the current quesiton's info is complete */
        return question;

    } /* end if (parseInt(thisCellsInfo.row) === row) */

  } /* end for loop */

  /* we will get here after reading the very last cell of the spreadsheet */
  return question;

  // return question;

} /* end function createQuestion3() */

function replaceChars(string) {
  /* http://stackoverflow.com/questions/2116558/fastest-method-to-replace-all-instances-of-a-character-in-a-string */
  if (string.indexOf('&') !== -1) {
    /* leave this first otherwise will replace '&' in subsequent searches */
    // string = string.replace('&', '&amp;');
    string = string.replace(/&/g, '&amp;');
  }  
  if (string.indexOf('<') !== -1) {
    // string = string.replace('<', '&lt;');
    string = string.replace(/</g, '&lt;');
  }
  if (string.indexOf('>') !== -1) {
    // string = string.replace('>', '&gt;');
    string = string.replace(/>/g, '&gt;');
  }
  if (string.indexOf('"') !== -1) {
    // string = string.replace('"', '\"');
    string = string.replace(/"/g, '\"');
  }
  // console.log(string);
  return string;
} /* end function replaceChars() */

getQuestionsFromGoogleDriveSpreadsheet();

 // $.getJSON('http://spreadsheets.google.com/tq?tq=' + thisQuery + '&key=' + spreadsheetId, function(data){
 //   console.log(data);
 // });

 /* ------------------------------- */

       var Request = false;
      if (window.XMLHttpRequest) {
        Request = new XMLHttpRequest();
      } else if (window.ActiveXObject) {
        Request = new ActiveXObject("Microsoft.XMLHTTP");
      }
      function getText(url, elementID) {
        if(Request) {
          // var RequestObj = document.getElementById(elementID);
          Request.open("GET", url);
          Request.onreadystatechange = function()
          {
            if (Request.readyState == 4 && Request.status == 200) {
                // RequestObj.innerHTML = Request.responseText;
                console.log(responseText);
            }
          }
          Request.send(null);
        }
      }

      // getText('http://spreadsheets.google.com/tq?tq=' + thisQuery + '&key=' + spreadsheetId, 'results');
      // getText('http://spreadsheets.google.com/tq?tq=select A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q&tqx=out:csv&key=1JkjprTYraBqUW-h9GWv817oUNML2oQN1oGzcRwMTRvo', 'results');

      // var query = new google.visualization.Query(DATA_SOURCE_URL);
      // query.setQuery('select dept, sum(salary) group by dept');
      // query.send(handleQueryResponse);

      //var query = new google.visualization.Query('http://spreadsheets.google.com/tq?tq=select A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q&key=1JkjprTYraBqUW-h9GWv817oUNML2oQN1oGzcRwMTRvo');
      // console.log(query);
      // query.send(function(google.visualization.QueryResponse) {console.log(google.visualization.QueryResponse);});

      


/* ------------------------------- */

}); /* end $(document).ready(function() {...} */





