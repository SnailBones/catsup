import json

# Define file paths
categories_file = 'categories.txt'
superlatives_file = 'superlatives.txt'
output_file = 'prompts.json'

# Function to read and sort words from a file
def read_and_sort(file_path):
    with open(file_path, 'r') as file:
        words = file.read().splitlines()
    duplicates = set([word for word in words if words.count(word) > 1])
    if duplicates:
        print(f"Warning: Duplicates found in {file_path}: {', '.join(duplicates)}")
    return sorted(set(words))

# Read and sort words from each file
categories = read_and_sort(categories_file)
superlatives = read_and_sort(superlatives_file)

# Combine the sorted lists into a dictionary
output_data = {
    "categories": categories,
    "superlatives": superlatives
}

# Write the dictionary to a JSON file
with open(output_file, 'w') as json_file:
    json.dump(output_data, json_file, indent=4)

l_cat = len(categories)
l_sup = len(superlatives)
print(f"{l_cat} categories, {l_sup} superlatives. {l_cat*l_sup} unique combinations.")
print(f"Data has been written to {output_file}")
