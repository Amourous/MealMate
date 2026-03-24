import zlib
import base64

def encode_plantuml(text):
    # UTF-8 -> Deflate -> Custom Base64
    utf8_data = text.encode('utf-8')
    # zlib.compress gives header and checksum, PlantUML needs raw deflate
    zlib_data = zlib.compress(utf8_data, 9)[2:-4]
    
    # Custom Base64 mapping: 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_
    standard_b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    plantuml_b64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
    
    encoded = base64.b64encode(zlib_data).decode('utf-8')
    res = ""
    for char in encoded:
        if char == '=': break
        idx = standard_b64.find(char)
        if idx == -1: continue # Handle characters not in standard b64 if any
        res += plantuml_b64[idx]
    return res

puml = """
@startuml
skinparam actorStyle awesome
skinparam usecase {
    BackgroundColor #d8f3dc
    BorderColor #1b4332
    ArrowColor #1b4332
    ActorBorderColor #2d6a4f
    ActorBackgroundColor #2d6a4f
    FontSize 12
    FontStyle bold
}
left to right direction

actor "Guest User" as Guest
actor "Authenticated User" as Auth

rectangle "  MealMate Application  " {
    (Register Account) as UC_Reg
    (Log In) as UC_Login
    (Browse & Search\\nRecipes) as UC_Browse
    
    (Manage Weekly\\nMeal Plan) as UC_Plan
    (Generate\\nGrocery List) as UC_List
    (Manage Pantry\\nInventory) as UC_Pantry
    (Monitor Weekly\\nBudget) as UC_Budget
    
    (Filter by\\nDietary Tags) as UC_Filter
    (Adjust\\nServing Sizes) as UC_Scale
}

Guest --> UC_Reg
Guest --> UC_Login
Guest --> UC_Browse

Auth --> UC_Browse
Auth --> UC_Plan
Auth --> UC_List
Auth --> UC_Pantry
Auth --> UC_Budget

UC_Browse <.. UC_Filter : <<extend>>
UC_Browse <.. UC_Scale : <<extend>>

UC_List ..> UC_Plan : <<include>>
UC_List ..> UC_Pantry : <<include>>

@enduml
"""

print(f"https://www.plantuml.com/plantuml/svg/{encode_plantuml(puml)}")
