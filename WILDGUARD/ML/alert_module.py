alerted = set()

def send_alert(detection):
    # Extract label from detection object if it's a dict, otherwise use as-is
    if isinstance(detection, dict):
        label = detection.get('type', 'unknown')
        species = detection.get('species', 'Unknown')
    else:
        label = detection
        species = 'Unknown'
    
    if label in alerted:
        return

    alerted.add(label)

    if label == "person":
        print("\n" + "="*50)
        print("🚨 ALERT: PERSON DETECTED!")
        print("🚨 CONFIRMED HUMAN INTRUSION")
        print("="*50 + "\n")
    elif label == "fire":
        print("\n" + "="*50)
        print("🔥 ALERT: FIRE DETECTED!")
        print("🔥 CONFIRMED FIRE DETECTED")
        print("="*50 + "\n")
    elif label.startswith("animal:"):
        animal_name = label.split(":", 1)[1]
        print("\n" + "="*50)
        print(f"🦁 ALERT: WILD ANIMAL DETECTED!")
        print(f"🦁 ANIMAL IDENTIFIED: {animal_name.upper()}")
        print(f"🦁 CONFIRMED {animal_name.upper()} DETECTED")
        print("="*50 + "\n")
    elif label == "animal" and isinstance(detection, dict):
        print("\n" + "="*50)
        print(f"🦁 ALERT: WILD ANIMAL DETECTED!")
        print(f"🦁 ANIMAL IDENTIFIED: {species.upper()}")
        print(f"🦁 CONFIRMED {species.upper()} DETECTED")
        print("="*50 + "\n")
