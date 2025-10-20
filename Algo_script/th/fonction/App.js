import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// Utilitaires mathématiques
const MathUtils = {
  // Parser de fonctions
  parseFunction: (funcStr) => {
    const sanitized = funcStr.replace(/\s/g, '').toLowerCase();
    
    const operations = {
      'sin': Math.sin,
      'cos': Math.cos,
      'tan': Math.tan,
      'ln': Math.log,
      'log': Math.log10,
      'sqrt': Math.sqrt,
      'abs': Math.abs,
      'exp': Math.exp
    };

    return (x) => {
      try {
        let expr = sanitized.replace(/x/g, `(${x})`);
        
        // Remplacer les fonctions mathématiques
        Object.keys(operations).forEach(func => {
          const regex = new RegExp(func + '\\(([^)]+)\\)', 'g');
          expr = expr.replace(regex, (match, p1) => {
            const value = eval(p1);
            return operations[func](value);
          });
        });
        
        // Remplacer les puissances
        expr = expr.replace(/\^/g, '**');
        
        // Évaluer l'expression
        return eval(expr);
      } catch (e) {
        return NaN;
      }
    };
  },

  // Calculateur de dérivée numérique
  derivative: (func, x, h = 0.001) => {
    return (func(x + h) - func(x - h)) / (2 * h);
  },

  // Détecteur d'asymptotes verticales
  findVerticalAsymptotes: (func, domain) => {
    const asymptotes = [];
    for (let x = domain.min; x <= domain.max; x += 0.1) {
      const y1 = func(x - 0.01);
      const y2 = func(x + 0.01);
      if ((Math.abs(y1) > 100 || Math.abs(y2) > 100) && 
          Math.sign(y1) !== Math.sign(y2)) {
        asymptotes.push(x);
      }
    }
    return asymptotes.filter((v, i, a) => a.findIndex(x => Math.abs(x - v) < 0.2) === i);
  }
};

// Composant de tracé de fonction
const FunctionPlotter = ({ functions, domain, range, asymptotes, showDerivative, className }) => {
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.5;
    
    const xStep = width / (domain.max - domain.min);
    const yStep = height / (range.max - range.min);
    
    // Vertical grid lines
    for (let x = domain.min; x <= domain.max; x += 1) {
      const canvasX = (x - domain.min) * xStep;
      ctx.beginPath();
      ctx.moveTo(canvasX, 0);
      ctx.lineTo(canvasX, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = range.min; y <= range.max; y += 1) {
      const canvasY = height - (y - range.min) * yStep;
      ctx.beginPath();
      ctx.moveTo(0, canvasY);
      ctx.lineTo(width, canvasY);
      ctx.stroke();
    }
    
    // Axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    
    // X-axis
    const yZero = height - (0 - range.min) * yStep;
    if (yZero >= 0 && yZero <= height) {
      ctx.beginPath();
      ctx.moveTo(0, yZero);
      ctx.lineTo(width, yZero);
      ctx.stroke();
    }
    
    // Y-axis
    const xZero = (0 - domain.min) * xStep;
    if (xZero >= 0 && xZero <= width) {
      ctx.beginPath();
      ctx.moveTo(xZero, 0);
      ctx.lineTo(xZero, height);
      ctx.stroke();
    }
    
    // Asymptotes verticales
    if (asymptotes) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      asymptotes.forEach(x => {
        const canvasX = (x - domain.min) * xStep;
        ctx.beginPath();
        ctx.moveTo(canvasX, 0);
        ctx.lineTo(canvasX, height);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }
    
    // Fonctions
    functions.forEach((funcData, index) => {
      ctx.strokeStyle = funcData.color || `hsl(${index * 60}, 70%, 50%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      let firstPoint = true;
      for (let canvasX = 0; canvasX < width; canvasX += 2) {
        const x = domain.min + (canvasX / width) * (domain.max - domain.min);
        const y = funcData.func(x);
        
        if (!isNaN(y) && isFinite(y)) {
          const canvasY = height - (y - range.min) * yStep;
          
          if (canvasY >= -50 && canvasY <= height + 50) {
            if (firstPoint) {
              ctx.moveTo(canvasX, canvasY);
              firstPoint = false;
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
          } else {
            firstPoint = true;
          }
        } else {
          firstPoint = true;
        }
      }
      ctx.stroke();
      
      // Dérivée si activée
      if (showDerivative && funcData.showDerivative) {
        ctx.strokeStyle = funcData.derivativeColor || '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        
        firstPoint = true;
        for (let canvasX = 0; canvasX < width; canvasX += 2) {
          const x = domain.min + (canvasX / width) * (domain.max - domain.min);
          const y = MathUtils.derivative(funcData.func, x);
          
          if (!isNaN(y) && isFinite(y)) {
            const canvasY = height - (y - range.min) * yStep;
            
            if (canvasY >= -50 && canvasY <= height + 50) {
              if (firstPoint) {
                ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
              } else {
                ctx.lineTo(canvasX, canvasY);
              }
            } else {
              firstPoint = true;
            }
          } else {
            firstPoint = true;
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    
  }, [functions, domain, range, asymptotes, showDerivative]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const mathX = domain.min + (x / canvas.width) * (domain.max - domain.min);
    const mathY = range.max - (y / canvas.height) * (range.max - range.min);
    
    setMousePos({ x: mathX, y: mathY });
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-2 border-gray-300 rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
      />
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded text-sm">
        x: {mousePos.x.toFixed(2)}, y: {mousePos.y.toFixed(2)}
      </div>
    </div>
  );
};

// Données des niveaux
const LEVELS_DATA = [
  {
    id: 1,
    title: "Fonctions Linéaires",
    description: "Découvrez les fonctions de la forme f(x) = ax + b",
    objective: "Comprendre la pente et l'ordonnée à l'origine",
    content: {
      theory: "Une fonction linéaire a la forme f(x) = ax + b où 'a' est la pente et 'b' l'ordonnée à l'origine.",
      example: "x + 2",
      exercises: [
        { question: "Trouvez la pente de f(x) = 3x + 1", answer: "3", type: "input" },
        { question: "Quelle est l'ordonnée à l'origine de f(x) = -2x + 5?", answer: "5", type: "input" }
      ]
    }
  },
  {
    id: 2,
    title: "Fonctions Quadratiques",
    description: "Explorez les paraboles avec f(x) = ax² + bx + c",
    objective: "Identifier le sommet et les racines",
    content: {
      theory: "Les fonctions quadratiques forment des paraboles. Le sommet se trouve en x = -b/(2a).",
      example: "x**2 - 4*x + 3",
      exercises: [
        { question: "Trouvez le sommet de f(x) = x² - 4x + 3", answer: "2", type: "input" },
        { question: "Cette parabole s'ouvre vers le haut ou le bas?", answer: "haut", type: "choice", choices: ["haut", "bas"] }
      ]
    }
  },
  {
    id: 3,
    title: "Fonctions Exponentielles",
    description: "Fonctions de croissance rapide f(x) = aˣ",
    objective: "Comprendre la croissance exponentielle",
    content: {
      theory: "Les fonctions exponentielles ont une croissance très rapide et ne s'annulent jamais.",
      example: "2**x",
      exercises: [
        { question: "Que vaut 2³?", answer: "8", type: "input" },
        { question: "L'asymptote horizontale de f(x) = 2ˣ est y = ?", answer: "0", type: "input" }
      ]
    }
  },
  {
    id: 4,
    title: "Fonctions Logarithmiques", 
    description: "L'inverse des exponentielles f(x) = log(x)",
    objective: "Maîtriser les propriétés des logarithmes",
    content: {
      theory: "Le logarithme est l'inverse de l'exponentielle. log(ab) = log(a) + log(b).",
      example: "Math.log(x)",
      exercises: [
        { question: "Que vaut log₂(8)?", answer: "3", type: "input" },
        { question: "Le domaine de définition de ln(x) est?", answer: "]0,+∞[", type: "input" }
      ]
    }
  },
  {
    id: 5,
    title: "Fonctions Rationnelles",
    description: "Quotients de polynômes f(x) = P(x)/Q(x)",
    objective: "Identifier les asymptotes verticales et horizontales",
    content: {
      theory: "Les fonctions rationnelles ont des asymptotes aux zéros du dénominateur.",
      example: "1/x",
      exercises: [
        { question: "Quelle est l'asymptote verticale de f(x) = 1/x?", answer: "0", type: "input" },
        { question: "Et l'asymptote horizontale?", answer: "0", type: "input" }
      ]
    }
  },
  {
    id: 6,
    title: "Dérivées",
    description: "Taux de variation instantané f'(x)",
    objective: "Calculer et interpréter les dérivées",
    content: {
      theory: "La dérivée représente la pente de la tangente en un point.",
      example: "2*x",
      exercises: [
        { question: "Dérivée de x² = ?", answer: "2x", type: "input" },
        { question: "Si f'(a) > 0, la fonction est?", answer: "croissante", type: "choice", choices: ["croissante", "décroissante"] }
      ]
    }
  },
  {
    id: 7,
    title: "Optimisation",
    description: "Trouver les extrema avec les dérivées",
    objective: "Résoudre des problèmes d'optimisation",
    content: {
      theory: "Les extrema se trouvent où f'(x) = 0 ou aux bornes du domaine.",
      example: "-x**2 + 4*x",
      exercises: [
        { question: "Maximum de f(x) = -x² + 4x en x = ?", answer: "2", type: "input" },
        { question: "Valeur du maximum?", answer: "4", type: "input" }
      ]
    }
  },
  {
    id: 8,
    title: "Fonctions Trigonométriques",
    description: "sin, cos, tan et leurs propriétés",
    objective: "Maîtriser les fonctions périodiques",
    content: {
      theory: "sin et cos sont périodiques de période 2π, avec des valeurs entre -1 et 1.",
      example: "Math.sin(x)",
      exercises: [
        { question: "Période de sin(x)?", answer: "2π", type: "input" },
        { question: "sin(π/2) = ?", answer: "1", type: "input" }
      ]
    }
  },
  {
    id: 9,
    title: "Compositions de Fonctions",
    description: "f(g(x)) et transformations",
    objective: "Comprendre les compositions et transformations",
    content: {
      theory: "La composition (f∘g)(x) = f(g(x)) permet de créer des fonctions complexes.",
      example: "Math.sin(x**2)",
      exercises: [
        { question: "Si f(x) = x² et g(x) = x+1, que vaut (f∘g)(2)?", answer: "9", type: "input" },
        { question: "f(x+2) représente une translation de combien vers la gauche?", answer: "2", type: "input" }
      ]
    }
  },
  {
    id: 10,
    title: "Projet Final - Modélisation",
    description: "Problème complet de modélisation",
    objective: "Appliquer toutes les notions dans un problème réel",
    content: {
      theory: "Un fabricant veut optimiser ses bénéfices. Le coût est C(x) = x² + 10x + 100 et le revenu R(x) = 50x.",
      example: "50*x - x**2 - 10*x - 100",
      exercises: [
        { question: "Fonction bénéfice B(x) = R(x) - C(x) = ?", answer: "-x²+40x-100", type: "input" },
        { question: "Production optimale (dérivée = 0)?", answer: "20", type: "input" },
        { question: "Bénéfice maximum?", answer: "300", type: "input" }
      ]
    }
  }
];

// Composant principal
const App = () => {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [userProgress, setUserProgress] = useState({});
  const [functions, setFunctions] = useState([]);
  const [functionInput, setFunctionInput] = useState('');
  const [domain, setDomain] = useState({ min: -10, max: 10 });
  const [range, setRange] = useState({ min: -10, max: 10 });
  const [showDerivative, setShowDerivative] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [exerciseComplete, setExerciseComplete] = useState(false);
  const [score, setScore] = useState(0);

  const addFunction = () => {
    if (!functionInput.trim()) return;
    
    try {
      const func = MathUtils.parseFunction(functionInput);
      const testValue = func(1);
      
      if (isNaN(testValue)) {
        alert('Fonction invalide. Vérifiez la syntaxe.');
        return;
      }
      
      const newFunction = {
        expression: functionInput,
        func: func,
        color: `hsl(${functions.length * 60}, 70%, 50%)`,
        derivativeColor: `hsl(${functions.length * 60}, 70%, 70%)`,
        showDerivative: showDerivative
      };
      
      setFunctions([...functions, newFunction]);
      
      // Calculer les asymptotes
      const asymptotes = MathUtils.findVerticalAsymptotes(func, domain);
      
      setFunctionInput('');
    } catch (error) {
      alert('Erreur dans la fonction. Exemples: x**2, sin(x), 1/x');
    }
  };

  const checkAnswer = () => {
    const level = LEVELS_DATA[currentLevel - 1];
    const exercise = level.content.exercises[currentExercise];
    
    const userAnswerLower = userAnswer.toLowerCase().trim();
    const correctAnswer = exercise.answer.toLowerCase().trim();
    
    if (userAnswerLower === correctAnswer) {
      setScore(score + 10);
      setExerciseComplete(true);
      
      setTimeout(() => {
        if (currentExercise < level.content.exercises.length - 1) {
          setCurrentExercise(currentExercise + 1);
          setUserAnswer('');
          setExerciseComplete(false);
        } else {
          // Niveau terminé
          setUserProgress({
            ...userProgress,
            [currentLevel]: true
          });
          alert(`🎉 Niveau ${currentLevel} terminé! Score: ${score + 10}`);
          setCurrentScreen('levels');
        }
      }, 1500);
    } else {
      alert('❌ Réponse incorrecte. Essayez encore!');
    }
  };

  const startLevel = (levelId) => {
    setCurrentLevel(levelId);
    setCurrentExercise(0);
    setUserAnswer('');
    setExerciseComplete(false);
    setCurrentScreen('level');
    
    // Charger la fonction exemple du niveau
    const level = LEVELS_DATA[levelId - 1];
    setFunctionInput(level.content.example);
    
    // Ajouter automatiquement la fonction exemple
    setTimeout(() => {
      const func = MathUtils.parseFunction(level.content.example);
      setFunctions([{
        expression: level.content.example,
        func: func,
        color: '#3b82f6',
        derivativeColor: '#f59e0b',
        showDerivative: false
      }]);
    }, 100);
  };

  // Écran d'accueil
  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-6">
              🎯 MathExplorer Pro
            </h1>
            <p className="text-2xl text-gray-700 mb-8">
              Maîtrisez les Fonctions Mathématiques de Manière Interactive
            </p>
            <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">🚀 Votre Voyage d'Apprentissage</h2>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📊</span>
                    <span className="text-lg">Tracez n'importe quelle fonction</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📐</span>
                    <span className="text-lg">Calculez les dérivées instantanément</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📈</span>
                    <span className="text-lg">Identifiez les asymptotes</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎮</span>
                    <span className="text-lg">10 niveaux progressifs</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🧠</span>
                    <span className="text-lg">Problèmes du monde réel</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏆</span>
                    <span className="text-lg">Système de progression gamifié</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-6">
                <button
                  onClick={() => setCurrentScreen('levels')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  🎯 Commencer l'Aventure
                </button>
                <button
                  onClick={() => setCurrentScreen('playground')}
                  className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  🧪 Mode Libre
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sélection des niveaux
  if (currentScreen === 'levels') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">🎯 Sélectionnez Votre Niveau</h1>
            <div className="flex space-x-4">
              <div className="bg-white px-4 py-2 rounded-full shadow-md">
                <span className="text-lg font-semibold">Score: {score}</span>
              </div>
              <button
                onClick={() => setCurrentScreen('welcome')}
                className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                🏠 Accueil
              </button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEVELS_DATA.map((level) => (
              <div
                key={level.id}
                className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  userProgress[level.id] ? 'border-2 border-green-500 bg-green-50' : 'border-2 border-transparent'
                }`}
                onClick={() => startLevel(level.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Niveau {level.id}</h3>
                  {userProgress[level.id] && <span className="text-2xl">✅</span>}
                </div>
                <h4 className="text-lg font-semibold text-blue-600 mb-2">{level.title}</h4>
                <p className="text-gray-600 mb-4">{level.description}</p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Objectif:</p>
                  <p className="text-sm text-blue-700">{level.objective}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Interface d'un niveau
  if (currentScreen === 'level') {
    const level = LEVELS_DATA[currentLevel - 1];
    const exercise = level.content.exercises[currentExercise];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-6 py-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Niveau {currentLevel}: {level.title}</h1>
              <p className="text-gray-600">Exercice {currentExercise + 1}/{level.content.exercises.length}</p>
            </div>
            <div className="flex space-x-4">
              <div className="bg-white px-4 py-2 rounded-full shadow-md">
                <span className="font-semibold">Score: {score}</span>
              </div>
              <button
                onClick={() => setCurrentScreen('levels')}
                className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                ← Retour
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Panneau de théorie */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-blue-600 mb-4">📚 Théorie</h3>
                <p className="text-gray-700 mb-4">{level.content.theory}</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-800">Exemple: {level.content.example}</p>
                </div>
              </div>

              {/* Exercice actuel */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-green-600 mb-4">🧩 Exercice</h3>
                <p className="text-lg text-gray-800 mb-4">{exercise.question}</p>
                
                {exercise.type === 'input' && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Votre réponse..."
                      disabled={exerciseComplete}
                    />
                    <button
                      onClick={checkAnswer}
                      disabled={exerciseComplete}
                      className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
                        exerciseComplete 
                          ? 'bg-green-500' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {exerciseComplete ? '✅ Correct!' : 'Vérifier'}
                    </button>
                  </div>
                )}

                {exercise.type === 'choice' && (
                  <div className="space-y-3">
                    {exercise.choices.map((choice, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setUserAnswer(choice);
                          setTimeout(checkAnswer, 100);
                        }}
                        disabled={exerciseComplete}
                        className="w-full p-3 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Graphique interactif */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-purple-600 mb-4">📊 Visualisation Interactive</h3>
              
              {/* Contrôles */}
              <div className="mb-4 space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={functionInput}
                    onChange={(e) => setFunctionInput(e.target.value)}
                    className="flex-1 p-2 border rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Entrez une fonction (ex: x**2, sin(x))"
                  />
                  <button
                    onClick={addFunction}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Tracer
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showDerivative}
                      onChange={(e) => setShowDerivative(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Afficher la dérivée</span>
                  </label>
                  <button
                    onClick={() => setFunctions([])}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Effacer
                  </button>
                </div>
              </div>

              {/* Graphique */}
              <FunctionPlotter
                functions={functions}
                domain={domain}
                range={range}
                asymptotes={functions.length > 0 ? MathUtils.findVerticalAsymptotes(functions[0].func, domain) : []}
                showDerivative={showDerivative}
              />

              {/* Légende */}
              {functions.length > 0 && (
                <div className="mt-4 space-y-2">
                  {functions.map((func, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: func.color }}
                      ></div>
                      <span className="text-sm">f(x) = {func.expression}</span>
                      {showDerivative && func.showDerivative && (
                        <>
                          <div
                            className="w-4 h-2 rounded"
                            style={{ backgroundColor: func.derivativeColor }}
                          ></div>
                          <span className="text-sm">f'(x)</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode playground
  if (currentScreen === 'playground') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🧪 Mode Libre - Explorez les Fonctions</h1>
            <button
              onClick={() => setCurrentScreen('welcome')}
              className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              🏠 Accueil
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Panneau de contrôle */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-blue-600 mb-4">🎛️ Contrôles</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fonction
                  </label>
                  <input
                    type="text"
                    value={functionInput}
                    onChange={(e) => setFunctionInput(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="ex: x**2, sin(x), 1/x"
                  />
                  <button
                    onClick={addFunction}
                    className="w-full mt-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Ajouter Fonction
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X min
                    </label>
                    <input
                      type="number"
                      value={domain.min}
                      onChange={(e) => setDomain({...domain, min: Number(e.target.value)})}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X max
                    </label>
                    <input
                      type="number"
                      value={domain.max}
                      onChange={(e) => setDomain({...domain, max: Number(e.target.value)})}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Y min
                    </label>
                    <input
                      type="number"
                      value={range.min}
                      onChange={(e) => setRange({...range, min: Number(e.target.value)})}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Y max
                    </label>
                    <input
                      type="number"
                      value={range.max}
                      onChange={(e) => setRange({...range, max: Number(e.target.value)})}
                      className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showDerivative}
                      onChange={(e) => setShowDerivative(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Afficher dérivée</span>
                  </label>
                </div>

                <button
                  onClick={() => setFunctions([])}
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Effacer Tout
                </button>
              </div>

              {/* Exemples rapides */}
              <div className="mt-6">
                <h4 className="font-bold text-gray-700 mb-3">⚡ Exemples Rapides</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['x**2', 'sin(x)', '1/x', 'Math.log(x)', 'x**3', 'Math.cos(x)'].map((example) => (
                    <button
                      key={example}
                      onClick={() => setFunctionInput(example)}
                      className="p-2 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Graphique */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-purple-600 mb-4">📊 Graphique Interactif</h3>
              
              <FunctionPlotter
                functions={functions}
                domain={domain}
                range={range}
                asymptotes={functions.length > 0 ? MathUtils.findVerticalAsymptotes(functions[0].func, domain) : []}
                showDerivative={showDerivative}
                className="mb-4"
              />

              {/* Légende et informations */}
              {functions.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-700 mb-2">📈 Fonctions Tracées</h4>
                    <div className="space-y-2">
                      {functions.map((func, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: func.color }}
                            ></div>
                            <span className="font-mono">f(x) = {func.expression}</span>
                          </div>
                          <button
                            onClick={() => setFunctions(functions.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asymptotes détectées */}
                  {functions.length > 0 && (
                    <div>
                      <h4 className="font-bold text-gray-700 mb-2">📐 Asymptotes Verticales Détectées</h4>
                      <div className="bg-red-50 p-3 rounded">
                        {MathUtils.findVerticalAsymptotes(functions[0].func, domain).map((asymptote, index) => (
                          <span key={index} className="inline-block bg-red-200 text-red-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                            x = {asymptote.toFixed(2)}
                          </span>
                        ))}
                        {MathUtils.findVerticalAsymptotes(functions[0].func, domain).length === 0 && (
                          <span className="text-gray-600">Aucune asymptote verticale détectée</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}W
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;