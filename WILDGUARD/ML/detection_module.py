import cv2
from ultralytics import YOLO

human_model = YOLO("models/yolov8n.pt")
fire_model = YOLO("models/best.pt")
animal_model = YOLO("models/best (3).pt")  # Wild animal detection model

# ---- ACCURACY PARAMETERS ----
HUMAN_CONF = 0.6
FIRE_CONF = 0.6
ANIMAL_CONF = 0.5         # confidence threshold for animal detection
MIN_BOX_AREA = 1500       # ignore tiny detections
CONFIRM_FRAMES = 3        # detection must appear in 3 frames

human_count = 0
fire_count = 0
animal_counts = {}         # track counts per animal type

def detect(frame):
    global human_count, fire_count
    detections = []

    # -------- HUMAN DETECTION --------
    human_results = human_model(frame, conf=HUMAN_CONF)
    human_detected = False

    for r in human_results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            label = human_model.names[int(box.cls[0])]
            if label != "person":
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)
            if area < MIN_BOX_AREA:
                continue

            human_detected = True
            confidence = float(box.conf[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(frame, "PERSON", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            # Store human detection confidence
            if 'human_confidences' not in globals():
                global human_confidences
                human_confidences = []
            human_confidences.append(confidence)

    # Initialize human_confidences if not already done
    if 'human_confidences' not in globals():
        human_confidences = []
    
    human_count = human_count + 1 if human_detected else 0
    if human_count >= CONFIRM_FRAMES:
        # Calculate average confidence from stored values
        recent_confidences = human_confidences[-CONFIRM_FRAMES:] if len(human_confidences) >= CONFIRM_FRAMES else human_confidences
        avg_confidence = sum(recent_confidences) / len(recent_confidences) if recent_confidences else 0
        
        detections.append({
            "type": "person",
            "species": "Human",
            "confidence": int(avg_confidence * 100),
            "camera": "Cam-01",
            "blindspot": "No"
        })
        # Reset confidences after confirmation
        human_confidences = []

    # -------- FIRE DETECTION --------
    fire_results = fire_model(frame, conf=FIRE_CONF)
    fire_detected = False

    for r in fire_results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)
            if area < MIN_BOX_AREA:
                continue

            fire_detected = True
            confidence = float(box.conf[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
            cv2.putText(frame, "FIRE", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
            
            # Store fire detection confidence
            if 'fire_confidences' not in globals():
                global fire_confidences
                fire_confidences = []
            fire_confidences.append(confidence)

    # Initialize fire_confidences if not already done
    if 'fire_confidences' not in globals():
        fire_confidences = []
    
    fire_count = fire_count + 1 if fire_detected else 0
    if fire_count >= CONFIRM_FRAMES:
        # Calculate average confidence from stored values
        recent_confidences = fire_confidences[-CONFIRM_FRAMES:] if len(fire_confidences) >= CONFIRM_FRAMES else fire_confidences
        avg_confidence = sum(recent_confidences) / len(recent_confidences) if recent_confidences else 0
        
        detections.append({
            "type": "fire",
            "species": "Fire",
            "confidence": int(avg_confidence * 100),
            "camera": "Cam-01",
            "blindspot": "No"
        })
        # Reset confidences after confirmation
        fire_confidences = []
    # -------- WILD ANIMAL DETECTION --------
    animal_results = animal_model(frame, conf=ANIMAL_CONF)
    detected_animals = set()

    for r in animal_results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            animal_label = animal_model.names[int(box.cls[0])]
            
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            area = (x2 - x1) * (y2 - y1)
            if area < MIN_BOX_AREA:
                continue

            detected_animals.add(animal_label)
            confidence = float(box.conf[0])
            
            # Draw bounding box for animal
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label_text = f"{animal_label.upper()} {confidence:.2f}"
            cv2.putText(frame, label_text, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            
            # Store the detection with confidence
            if animal_label not in animal_counts:
                animal_counts[animal_label] = []
            animal_counts[animal_label].append(confidence)

    # Confirm animal detections
    for animal in detected_animals:
        if animal not in animal_counts or not isinstance(animal_counts[animal], list):
            animal_counts[animal] = []
        
        # Count the detections
        animal_counts[animal].append(0)  # We'll use the last value for confirmation
        
        if len(animal_counts[animal]) >= CONFIRM_FRAMES:
            # Calculate average confidence from the stored values
            recent_confidences = [x for x in animal_counts[animal] if isinstance(x, (int, float))][-CONFIRM_FRAMES:]
            avg_confidence = sum(recent_confidences) / len(recent_confidences) if recent_confidences else 0
            
            detections.append({
                "type": "animal",
                "species": animal,
                "confidence": int(avg_confidence * 100),
                "camera": "Cam-01",
                "blindspot": "No"
            })
            # Reset count after confirming
            animal_counts[animal] = []
    
    # Reset counts for animals not detected in this frame
    animals_to_remove = []
    for animal in animal_counts:
        if animal not in detected_animals:
            animal_counts[animal] = 0
            animals_to_remove.append(animal)
    
    for animal in animals_to_remove:
        if animal_counts[animal] == 0:
            del animal_counts[animal]

    # Return the detections with proper object structure
    return detections, frame
