import pandas as pd

file_path = 'DataBases/PromptDataBases.xlsx'
user_data = pd.read_excel(file_path)

def addRowOneTime(Topic, Example1, Example2):
    data = pd.DataFrame(columns=['Topic', 'Example1', 'Example2', ])

    new_row=({
        'Topic': [Topic],
        'Example1': [Example1],
        'Example2': [Example2],

    }
    )
    updated_data = pd.concat([data, new_row], ignore_index=True)
    updated_data.to_excel(file_path, index=False)

def getPromptExcercise(Topic):
   return user_data.loc[user_data['Topic'] == Topic].drop('Topic', axis=1).values.flatten()


print(getPromptExcercise("Substraction"))

    




