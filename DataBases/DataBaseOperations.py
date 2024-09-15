import pandas as pd

file_path = 'DataBases/StudentDataBase.xlsx'
user_data = pd.read_excel(file_path)

def AddStudent(Classroom, StudentId, Name, Age, Country, Gender, Interest, FavoriteFood, BestFriend,GradeLevel):
    try:
        existing_data = pd.read_excel(file_path)
    except FileNotFoundError:
        existing_data = pd.DataFrame(columns=['Classroom', 'StudentId', 'Name', 'Age', 'Country','GradeLevel','Gender', 'Interest','FavoriteFood' ,'BestFriend', 'Points']) 
    new_row = pd.DataFrame({
        'Classroom': [Classroom],
        'StudentId': [StudentId],
        'Name': [Name],
        'Age': [Age],
        'Country':[Country],
        'Gender': [Gender],
        'Interest': [Interest],
        'FavoriteFood': [FavoriteFood],
        'BestFriend' : [BestFriend],
        'Points' : [0],
        'GradeLevel': [GradeLevel]

    })
    updated_data = pd.concat([existing_data, new_row], ignore_index=True)
    updated_data.to_excel(file_path, index=False)


def updatePoints(Classroom, StudentId, AddingPoints):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    user_data.loc[condition, 'Points'] += AddingPoints
    user_data.to_excel(file_path, index=False)
    
def getTotalPoints(Classroom, StudentId):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    return user_data.loc[condition , 'Points'].iloc[0]

def getCurrentLevel(Classroom, StudentId):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    points = user_data.loc[condition, 'Points'].iloc[0]
    return int(points/100)

def getPartialPoints(Classroom, StudentId):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    points = user_data.loc[condition, 'Points'].iloc[0]
    number_str = str(points/100)
    decimal_part = number_str.split('.')[1]
    return int(decimal_part)

def getName(Classroom, StudentId):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    return user_data.loc[condition , 'Name'].iloc[0]

def getContext(Classroom, StudentId):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    interest = user_data.loc[condition, 'Interest'].iloc[0]
    name = user_data.loc[condition , 'Name'].iloc[0]
    age = user_data.loc[condition , 'Age'].iloc[0]
    age = str(age)
    gender  = user_data.loc[condition , 'Gender'].iloc[0]
    favoritefood= user_data.loc[condition, 'FavoriteFood'].iloc[0]
    bestfriend= user_data.loc[condition, 'BestFriend'].iloc[0]
    conext= "The student named " + name + " with age " + age + " of gender " + gender + " who has the following interests " + interest + ", whos favorite food is " + favoritefood + " and whos best friend is " + bestfriend
    return conext

def updateInterests(Classroom, StudentId, NewInterest):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    user_data.loc[condition, 'Interest'] = NewInterest
    user_data.to_excel(file_path, index=False)

def updateFavoriteFood(Classroom, StudentId, NewFood):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    user_data.loc[condition, 'Interest'] = NewFood
    user_data.to_excel(file_path, index=False)

def updateBestFriend(Classroom, StudentId, NewFriend):
    condition = (user_data['StudentId'] == StudentId) & (user_data['Classroom'] == Classroom)
    user_data.loc[condition, 'Interest'] = NewFriend
    user_data.to_excel(file_path, index=False)

print(getTotalPoints(1,1))
print(getCurrentLevel(1,1))
print(getPartialPoints(1,1))

